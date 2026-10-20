// Sample Tahun akademik of this file: 4414 to 4414.
// Sample NIMs of this file: 9944150000 to 9944150099.
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import {
  ALREADY_REMOVED,
  NOT_ALLOWED_TO_WRITE,
  NOTE_NOT_FOUND,
} from "./note-messages";
import { readNoteCategory } from "./placed-notes";
import { removeViolationNote } from "./remove-violation-note";
import {
  addNoteActor,
  addNotePeriods,
  addNoteStudents,
  addTestNote,
  linesOf,
  noteAt,
} from "./test-violation-notes";

const inTestDatabase = withTestDatabase();

const MOMENT = new Date("4414-10-20T03:00:00Z");

async function setting(db: Database) {
  await addNotePeriods(db, 4414);
  const { studentIds } = await addNoteStudents(
    db,
    "Prodi Uji Hapus Catatan",
    "Mahasiswa Uji Hapus Catatan",
    ["9944150001"],
  );
  const officer = await addNoteActor(db, "Pembina Uji Hapus", [
    "discipline_officer",
  ]);
  const studentId = studentIds[0] ?? "";
  const first = await addTestNote(db, studentId, officer.id, "4414-09-01");
  const second = await addTestNote(db, studentId, officer.id, "4414-09-02");
  return { officer, first, second };
}

describe("removeViolationNote", () => {
  it("marks the note removed with who and when, never erased, with a line in the log, and the next note becomes Pelanggaran pertama", async () => {
    await inTestDatabase(async (db) => {
      const { officer, first, second } = await setting(db);
      const head = await addNoteActor(db, "Kepala Uji Hapus", ["head_of_unit"]);
      expect(await readNoteCategory(db, second)).toBe("further");

      expect(await removeViolationNote(db, head, first, MOMENT)).toEqual({
        ok: true,
        value: null,
      });

      const kept = await noteAt(db, first);
      expect(kept?.removedBy).toBe(head.id);
      expect(kept?.removedAt).toEqual(MOMENT);
      const lines = await linesOf(db, first);
      expect(lines.map((line) => [line.action, line.changedBy])).toEqual([
        ["added", officer.id],
        ["removed", head.id],
      ]);
      expect(await readNoteCategory(db, second)).toBe("first");
    });
  });

  it("tells the second remover the note is already removed, and refuses a note that is not there", async () => {
    await inTestDatabase(async (db) => {
      const { officer, first } = await setting(db);
      await removeViolationNote(db, officer, first, MOMENT);

      expect(await removeViolationNote(db, officer, first, MOMENT)).toEqual(
        ALREADY_REMOVED,
      );
      expect(
        await removeViolationNote(db, officer, crypto.randomUUID(), MOMENT),
      ).toEqual(NOTE_NOT_FOUND);
      expect(await removeViolationNote(db, officer, "x", MOMENT)).toEqual(
        NOTE_NOT_FOUND,
      );
      expect(await linesOf(db, first)).toHaveLength(2);
    });
  });

  it.each([
    "director",
    "head_of_program",
    "mentor",
    "student",
    "dorm_manager",
  ] as const)("refuses a hand-made removal of %s", async (role) => {
    await inTestDatabase(async (db) => {
      const { first } = await setting(db);
      const actor = await addNoteActor(db, "Bukan Penghapus Uji", [role]);

      expect(await removeViolationNote(db, actor, first, MOMENT)).toEqual(
        NOT_ALLOWED_TO_WRITE,
      );
      expect((await noteAt(db, first))?.removedAt).toBeNull();
    });
  });
});
