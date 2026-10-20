// Sample NIMs of this file: 9944220000 to 9944220099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  readPenaltyHistory,
  readPenaltyPick,
  searchPenaltyStudents,
} from "./penalty-student";
import { addTestPenalty, NO_SOCIAL_WORK } from "./test-discipline-penalties";
import { addNoteActor, addNoteStudents } from "./test-violation-notes";

const inTestDatabase = withTestDatabase();

async function setting(db: Database) {
  const { studentIds, programId } = await addNoteStudents(
    db,
    "Prodi Uji Pilih Hukuman",
    "Mahasiswa Uji Pilih Hukuman",
    ["9944220001", "9944220002", "9944220003"],
  );
  await db
    .update(students)
    .set({ originAgency: "Instansi Uji", cohortYear: 2024 })
    .where(eq(students.id, studentIds[0] ?? ""));
  await db
    .update(students)
    .set({ status: "on_leave" })
    .where(eq(students.id, studentIds[2] ?? ""));
  const officer = await addNoteActor(db, "Pembina Uji Pilih", [
    "discipline_officer",
  ]);
  return { officer, studentIds, programId };
}

describe("searchPenaltyStudents", () => {
  it("finds the Aktif students by name or NIM, with whether each has an Instansi asal and their angkatan", async () => {
    await inTestDatabase(async (db) => {
      const { officer, studentIds } = await setting(db);

      const found = await searchPenaltyStudents(db, officer, "Pilih Hukuman");

      expect(found).toEqual([
        {
          id: studentIds[0],
          name: "Mahasiswa Uji Pilih Hukuman 1",
          nim: "9944220001",
          program: "Prodi Uji Pilih Hukuman",
          hasAgency: true,
          cohortYear: 2024,
        },
        expect.objectContaining({ nim: "9944220002", hasAgency: false }),
      ]);
      expect(await searchPenaltyStudents(db, officer, "  ")).toEqual([]);
      expect(await searchPenaltyStudents(db, officer, 7)).toEqual([]);
    });
  });

  it.each(["director", "head_of_program", "mentor"] as const)(
    "finds nobody for %s, who only reads",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { programId } = await setting(db);
        const reader = await addNoteActor(
          db,
          "Pembaca Uji Pilih",
          [role],
          programId,
        );

        expect(
          await searchPenaltyStudents(db, reader, "Pilih Hukuman"),
        ).toEqual([]);
      });
    },
  );
});

describe("readPenaltyPick", () => {
  it("gives an Aktif student the account may record for, and nothing for one on Cuti, an unknown key or a reader", async () => {
    await inTestDatabase(async (db) => {
      const { officer, studentIds } = await setting(db);
      const director = await addNoteActor(db, "Direktur Uji Pilih", [
        "director",
      ]);

      expect(
        (await readPenaltyPick(db, officer, studentIds[0] ?? ""))?.nim,
      ).toBe("9944220001");
      expect(
        await readPenaltyPick(db, officer, studentIds[2] ?? ""),
      ).toBeNull();
      expect(await readPenaltyPick(db, officer, "bukan-kunci")).toBeNull();
      expect(
        await readPenaltyPick(db, director, studentIds[0] ?? ""),
      ).toBeNull();
    });
  });
});

describe("readPenaltyHistory", () => {
  it("gives how many penalties the student has and the highest, the latest of two as high", async () => {
    await inTestDatabase(async (db) => {
      const { officer, studentIds } = await setting(db);
      const [one = "", two = ""] = studentIds;
      await addTestPenalty(db, one, officer.id, "2026-09-01", {
        category: "medium",
        level: 1,
      });
      await addTestPenalty(db, one, officer.id, "2026-09-20", {
        category: "medium",
        level: 1,
      });
      await addTestPenalty(db, one, officer.id, "2026-10-01");

      expect(await readPenaltyHistory(db, officer, one)).toEqual({
        count: 3,
        top: { category: "medium", level: 1, day: "2026-09-20" },
      });
      expect(await readPenaltyHistory(db, officer, two)).toEqual({
        count: 0,
        top: null,
      });
    });
  });

  it("ranks Berat above every Sedang", async () => {
    await inTestDatabase(async (db) => {
      const { officer, studentIds } = await setting(db);
      const [one = ""] = studentIds;
      await addTestPenalty(db, one, officer.id, "2026-09-01", {
        category: "heavy",
        level: 2,
        status: "set",
        ...NO_SOCIAL_WORK,
      });
      await addTestPenalty(db, one, officer.id, "2026-10-01", {
        category: "medium",
        level: 3,
      });

      const history = await readPenaltyHistory(db, officer, one);
      expect(history?.top).toEqual({
        category: "heavy",
        level: 2,
        day: "2026-09-01",
      });
    });
  });

  it("gives nothing for a student the account may not record for", async () => {
    await inTestDatabase(async (db) => {
      const { studentIds, programId } = await setting(db);
      const kaprodi = await addNoteActor(
        db,
        "Kaprodi Uji Riwayat",
        ["head_of_program"],
        programId,
      );

      expect(
        await readPenaltyHistory(db, kaprodi, studentIds[0] ?? ""),
      ).toBeNull();
    });
  });
});
