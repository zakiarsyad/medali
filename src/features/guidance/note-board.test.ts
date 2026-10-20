// Sample Tahun akademik of this file: 4409 to 4410.
// Sample NIMs of this file: 9944110000 to 9944110099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { violationNotes } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { NOTES_START, type NotesParams } from "./note-address";
import { readNoteBoard } from "./note-board";
import {
  addNoteActor,
  addNotePeriods,
  addNoteStudents,
  addTestNote,
} from "./test-violation-notes";

const inTestDatabase = withTestDatabase();

/** A day of Ganjil 4410/4411, which runs then. */
const TODAY = "4410-10-20";
/** A day of Genap 4409/4410, the semester before. */
const PAST_DAY = "4410-05-04";

interface Setting {
  officer: AccountForAccess;
  /** Students of Prodi A: Mahasiswa Uji Catatan A 1 to 3. */
  inA: string[];
  /** A student of Prodi B: Mahasiswa Uji Catatan B 1. */
  inB: string;
  programA: number;
}

async function setting(db: Database): Promise<Setting> {
  await addNotePeriods(db, 4409);
  await addNotePeriods(db, 4410);
  const a = await addNoteStudents(
    db,
    "Prodi Uji Catatan A",
    "Mahasiswa Uji Catatan A",
    ["9944110001", "9944110002", "9944110003"],
  );
  const b = await addNoteStudents(
    db,
    "Prodi Uji Catatan B",
    "Mahasiswa Uji Catatan B",
    ["9944110011"],
  );
  const officer = await addNoteActor(db, "Pembina Uji Daftar", [
    "discipline_officer",
  ]);
  return {
    officer,
    inA: a.studentIds,
    inB: b.studentIds[0] ?? "",
    programA: a.programId,
  };
}

function read(
  db: Database,
  actor: AccountForAccess,
  more: Partial<NotesParams> = {},
) {
  return readNoteBoard(db, actor, { ...NOTES_START, ...more }, TODAY);
}

async function reader(db: Database, roles: RoleId[], programId?: number) {
  return addNoteActor(db, "Pembaca Uji Daftar", roles, programId ?? null);
}

describe("readNoteBoard", () => {
  it("counts the active notes of the running semester, Pelanggaran pertama and lanjutan, and Mahasiswa berulang", async () => {
    await inTestDatabase(async (db) => {
      const { officer, inA, inB } = await setting(db);
      const [one = "", two = ""] = inA;
      await addTestNote(db, one, officer.id, "4410-09-01");
      await addTestNote(db, one, officer.id, "4410-10-01");
      await addTestNote(db, one, officer.id, "4410-10-10");
      await addTestNote(db, two, officer.id, "4410-10-02");
      await addTestNote(db, inB, officer.id, PAST_DAY);

      const board = await read(db, officer);

      expect(board?.numbers).toEqual({
        active: 4,
        first: 2,
        further: 2,
        repeated: 1,
      });
      expect(board?.period?.startsOn).toBe("4410-08-01");
    });
  });

  it("lists the active notes, the latest first, with their Kategori and how many active notes a repeated student has", async () => {
    await inTestDatabase(async (db) => {
      const { officer, inA, inB } = await setting(db);
      const [one = "", two = ""] = inA;
      const early = await addTestNote(db, one, officer.id, "4410-09-01");
      const later = await addTestNote(db, one, officer.id, "4410-10-01");
      const other = await addTestNote(db, two, officer.id, "4410-10-02", {
        punishment: "other",
        otherPunishment: "Menyapu halaman",
        remark: "Sudah diingatkan.",
      });
      await addTestNote(db, inB, officer.id, PAST_DAY);

      const board = await read(db, officer);

      expect(board?.list.matching).toBe(3);
      expect(
        board?.list.rows.map((row) => [
          row.id,
          row.category,
          row.activeNotes,
          row.isActive,
        ]),
      ).toEqual([
        [other, "first", 1, true],
        [later, "further", 2, true],
        [early, "first", 2, true],
      ]);
      expect(board?.list.rows[0]).toEqual(
        expect.objectContaining({
          name: "Mahasiswa Uji Catatan A 2",
          nim: "9944110002",
          day: "4410-10-02",
          punishment: "other",
          otherPunishment: "Menyapu halaman",
          remark: "Sudah diingatkan.",
          savedByName: "Pembina Uji Daftar",
        }),
      );
    });
  });

  it("also lists the notes of past semesters when asked, as no longer in force, with their Kategori in their own semester", async () => {
    await inTestDatabase(async (db) => {
      const { officer, inA } = await setting(db);
      const [one = ""] = inA;
      const past = await addTestNote(db, one, officer.id, PAST_DAY);
      const now = await addTestNote(db, one, officer.id, "4410-09-01");

      const shown = await read(db, officer, { past: true });

      expect(
        shown?.list.rows.map((row) => [
          row.id,
          row.category,
          row.isActive,
          row.activeNotes,
        ]),
      ).toEqual([
        [now, "first", true, 1],
        [past, "first", false, null],
      ]);
      expect((await read(db, officer))?.list.matching).toBe(1);
    });
  });

  it("narrows the list by Kategori and by a name or a NIM, and finds nothing for a filter nothing matches", async () => {
    await inTestDatabase(async (db) => {
      const { officer, inA, inB } = await setting(db);
      const [one = ""] = inA;
      await addTestNote(db, one, officer.id, "4410-09-01");
      const further = await addTestNote(db, one, officer.id, "4410-09-02");
      const ofB = await addTestNote(db, inB, officer.id, "4410-09-03");

      const ids = async (more: Partial<NotesParams>) =>
        (await read(db, officer, more))?.list.rows.map((row) => row.id);

      expect(await ids({ category: "further" })).toEqual([further]);
      expect(await ids({ query: "catatan b" })).toEqual([ofB]);
      expect(await ids({ query: "9944110011" })).toEqual([ofB]);
      expect(await ids({ query: "tidak ada" })).toEqual([]);
    });
  });

  it("leaves a removed note out of the numbers and the list, and works the Kategori out again from the notes that remain", async () => {
    await inTestDatabase(async (db) => {
      const { officer, inA } = await setting(db);
      const [one = ""] = inA;
      const first = await addTestNote(db, one, officer.id, "4410-09-01");
      const second = await addTestNote(db, one, officer.id, "4410-09-02");
      await db
        .update(violationNotes)
        .set({
          removedBy: officer.id,
          removedAt: new Date("4410-10-05T03:00:00Z"),
        })
        .where(eq(violationNotes.id, first));

      const board = await read(db, officer);

      expect(board?.numbers).toEqual({
        active: 1,
        first: 1,
        further: 0,
        repeated: 0,
      });
      expect(board?.list.rows.map((row) => [row.id, row.category])).toEqual([
        [second, "first"],
      ]);
    });
  });

  it("gives Ketua Program Studi the numbers and notes of their own program only, whatever they search for", async () => {
    await inTestDatabase(async (db) => {
      const { officer, inA, inB, programA } = await setting(db);
      const [one = "", two = ""] = inA;
      await addTestNote(db, one, officer.id, "4410-09-01");
      await addTestNote(db, two, officer.id, "4410-09-01");
      await addTestNote(db, inB, officer.id, "4410-09-01");
      await addTestNote(db, inB, officer.id, "4410-09-02");
      const kaprodi = await reader(db, ["head_of_program"], programA);
      const director = await reader(db, ["director"]);

      const own = await read(db, kaprodi);
      expect(own?.numbers).toEqual({
        active: 2,
        first: 2,
        further: 0,
        repeated: 0,
      });
      expect(own?.list.matching).toBe(2);
      expect((await read(db, kaprodi, { query: "9944110011" }))?.list).toEqual(
        expect.objectContaining({ matching: 0, rows: [] }),
      );
      expect((await read(db, director))?.list.matching).toBe(4);
    });
  });

  it.each([
    "mentor",
    "student",
    "counsellor",
    "dorm_manager",
    "bam_bphk",
  ] as const)("reads nothing for %s", async (role) => {
    await inTestDatabase(async (db) => {
      const { officer, inA } = await setting(db);
      await addTestNote(db, inA[0] ?? "", officer.id, "4410-09-01");
      const other = await reader(db, [role]);

      expect(await read(db, other)).toBeNull();
    });
  });

  it("shows 25 notes a page, and the last page for a page past the end", async () => {
    await inTestDatabase(async (db) => {
      const { officer, inA } = await setting(db);
      for (let day = 1; day <= 26; day += 1) {
        const date = `4410-09-${String(day).padStart(2, "0")}`;
        await addTestNote(db, inA[day % 3] ?? "", officer.id, date);
      }

      const first = await read(db, officer);
      const second = await read(db, officer, { page: 2 });
      const beyond = await read(db, officer, { page: 9 });

      expect(first?.list.rows).toHaveLength(25);
      expect(first?.list.matching).toBe(26);
      expect(second?.list.rows.map((row) => row.day)).toEqual(["4410-09-01"]);
      expect(beyond?.list.page).toBe(2);
    });
  });
});
