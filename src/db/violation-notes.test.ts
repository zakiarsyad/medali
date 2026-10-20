// Sample NIMs of this file: 9944100000 to 9944100099.
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  addNoteActor,
  addNoteStudents,
  addTestNote,
} from "@/features/guidance/test-violation-notes";
import type { Database } from "./connect";
import { violationNoteChanges, violationNotes } from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

/** In a transaction of its own, so a refusal does not end the check's. */
function inOwnStep<Answer>(db: Database, step: (tx: Database) => Answer) {
  return db.transaction(async (tx) => step(tx));
}

async function addNamed(db: Database, nim: string) {
  const officer = await addNoteActor(db, "Pembina Uji Tabel Catatan", [
    "discipline_officer",
  ]);
  const { studentIds } = await addNoteStudents(
    db,
    `Prodi Uji Tabel Catatan ${nim}`,
    "Mahasiswa Uji Tabel Catatan",
    [nim],
  );
  const [studentId = ""] = studentIds;
  return { studentId, by: officer.id };
}

const DAY = "2026-10-12";

describe("a violation note", () => {
  it.each([
    ["an Uraian under 5 letters", { description: "Tela" }],
    ["an Uraian over 300 characters", { description: "a".repeat(301) }],
    ["Hukuman lainnya with no text", { punishment: "other" as const }],
    [
      "a text of Hukuman lainnya for another punishment",
      { otherPunishment: "Menyapu halaman" },
    ],
    ["a Keterangan over 500 characters", { remark: "a".repeat(501) }],
    [
      "a save before its Tanggal",
      { savedAt: new Date("2026-10-11T10:00:00+07:00") },
    ],
    ["a removal without who", { removedAt: new Date("2026-10-13T00:00:00Z") }],
  ])("refuses %s", async (_, more) => {
    await inTestDatabase(async (db) => {
      const { studentId, by } = await addNamed(db, "9944100001");
      const kept = inOwnStep(db, (tx) =>
        tx.insert(violationNotes).values({
          id: crypto.randomUUID(),
          studentId,
          day: DAY,
          description: "Terlambat mengikuti apel pagi",
          punishment: "warning",
          savedBy: by,
          savedAt: new Date(`${DAY}T10:00:00+07:00`),
          ...more,
        }),
      );

      await expect(kept).rejects.toThrow();
    });
  });

  it("may be marked removed once, with who and when, and is never changed otherwise or deleted", async () => {
    await inTestDatabase(async (db) => {
      const { studentId, by } = await addNamed(db, "9944100002");
      const id = await addTestNote(db, studentId, by, DAY);
      const removedAt = new Date("2026-10-13T03:00:00Z");

      await db
        .update(violationNotes)
        .set({ removedBy: by, removedAt })
        .where(eq(violationNotes.id, id));

      const again = inOwnStep(db, (tx) =>
        tx
          .update(violationNotes)
          .set({ removedAt: new Date() })
          .where(eq(violationNotes.id, id)),
      );
      await expect(again).rejects.toThrow();
      const other = await addTestNote(db, studentId, by, DAY);
      const changed = inOwnStep(db, (tx) =>
        tx
          .update(violationNotes)
          .set({ description: "Uraian yang diubah" })
          .where(eq(violationNotes.id, other)),
      );
      await expect(changed).rejects.toThrow();
      const deleted = inOwnStep(db, (tx) =>
        tx.delete(violationNotes).where(eq(violationNotes.id, other)),
      );
      await expect(deleted).rejects.toThrow();
    });
  });
});

describe("the log of violation notes", () => {
  it("refuses to change, delete or empty a line", async () => {
    await inTestDatabase(async (db) => {
      const { studentId, by } = await addNamed(db, "9944100003");
      const id = await addTestNote(db, studentId, by, DAY);

      const changed = inOwnStep(db, (tx) =>
        tx
          .update(violationNoteChanges)
          .set({ action: "removed" })
          .where(eq(violationNoteChanges.noteId, id)),
      );
      await expect(changed).rejects.toThrow();
      const deleted = inOwnStep(db, (tx) =>
        tx
          .delete(violationNoteChanges)
          .where(eq(violationNoteChanges.noteId, id)),
      );
      await expect(deleted).rejects.toThrow();
      const emptied = inOwnStep(db, (tx) =>
        tx.execute(sql`truncate violation_note_changes`),
      );
      await expect(emptied).rejects.toThrow();
    });
  });
});
