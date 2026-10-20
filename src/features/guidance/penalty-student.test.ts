// Sample NIMs of this file: 9944220000 to 9944220099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { readPenaltyPick, searchPenaltyStudents } from "./penalty-student";
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
