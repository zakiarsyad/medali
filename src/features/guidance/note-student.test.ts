// Sample Tahun akademik of this file: 4412 to 4412.
// Sample NIMs of this file: 9944130000 to 9944130099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { students, violationNotes } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { readStudentBox, searchNoteStudents } from "./note-student";
import {
  addNoteActor,
  addNotePeriods,
  addNoteStudents,
  addTestNote,
} from "./test-violation-notes";

const inTestDatabase = withTestDatabase();

const TODAY = "4412-10-20";

async function setting(db: Database) {
  await addNotePeriods(db, 4412);
  const { studentIds } = await addNoteStudents(
    db,
    "Prodi Uji Kotak Catatan",
    "Mahasiswa Uji Kotak Catatan",
    ["9944130001", "9944130002", "9944130003"],
  );
  const officer = await addNoteActor(db, "Pembina Uji Kotak", [
    "discipline_officer",
  ]);
  return { officer, studentIds };
}

describe("searchNoteStudents", () => {
  it("finds the Aktif students by name or NIM, and nobody for an empty text", async () => {
    await inTestDatabase(async (db) => {
      const { officer, studentIds } = await setting(db);
      await db
        .update(students)
        .set({ status: "on_leave" })
        .where(eq(students.id, studentIds[2] ?? ""));

      const found = await searchNoteStudents(db, officer, "Kotak Catatan");

      expect(found.map((pick) => pick.nim)).toEqual([
        "9944130001",
        "9944130002",
      ]);
      expect(found[0]?.program).toBe("Prodi Uji Kotak Catatan");
      expect(
        (await searchNoteStudents(db, officer, "9944130002")).map((p) => p.nim),
      ).toEqual(["9944130002"]);
      expect(await searchNoteStudents(db, officer, "  ")).toEqual([]);
      expect(await searchNoteStudents(db, officer, 7)).toEqual([]);
    });
  });

  it.each(["director", "head_of_program"] as const)(
    "finds nobody for %s, who only reads",
    async (role) => {
      await inTestDatabase(async (db) => {
        await setting(db);
        const reader = await addNoteActor(db, "Pembaca Uji Kotak", [role]);

        expect(await searchNoteStudents(db, reader, "Kotak")).toEqual([]);
      });
    },
  );
});

describe("readStudentBox", () => {
  it("gives the student's notes of this semester that are not removed, the earliest first", async () => {
    await inTestDatabase(async (db) => {
      const { officer, studentIds } = await setting(db);
      const [one = "", two = ""] = studentIds;
      await addTestNote(db, one, officer.id, "4412-07-01");
      await addTestNote(db, one, officer.id, "4412-10-02", {
        description: "Membuat kegaduhan di ruang belajar",
      });
      await addTestNote(db, one, officer.id, "4412-09-01");
      const removed = await addTestNote(db, one, officer.id, "4412-09-05");
      await db
        .update(violationNotes)
        .set({
          removedBy: officer.id,
          removedAt: new Date("4412-09-06T03:00:00Z"),
        })
        .where(eq(violationNotes.id, removed));

      expect(await readStudentBox(db, officer, one, TODAY)).toEqual([
        { day: "4412-09-01", description: "Terlambat mengikuti apel pagi" },
        {
          day: "4412-10-02",
          description: "Membuat kegaduhan di ruang belajar",
        },
      ]);
      expect(await readStudentBox(db, officer, two, TODAY)).toEqual([]);
    });
  });

  it("gives nothing for a role that only reads, or for a student who is not there", async () => {
    await inTestDatabase(async (db) => {
      const { officer, studentIds } = await setting(db);
      const director = await addNoteActor(db, "Direktur Uji Kotak", [
        "director",
      ]);

      expect(
        await readStudentBox(db, director, studentIds[0] ?? "", TODAY),
      ).toBeNull();
      expect(await readStudentBox(db, officer, "x", TODAY)).toBeNull();
    });
  });
});
