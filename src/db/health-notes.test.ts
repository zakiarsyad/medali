// Sample NIMs of this file: 9986300000 to 9986300099.
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ADVICE_MAX, SHORT_TEXT_MAX } from "@/features/fitness/health-ids";
import { addTestActor, addTestStudents } from "@/features/fitness/test-fitness";
import { addTestNote, type TestNote } from "@/features/fitness/test-health";
import type { Database } from "./connect";
import {
  healthNoteIllnesses,
  healthNotes,
  healthRecapReadings,
} from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

/** In a transaction of its own, so a refusal does not end the check's. */
function inOwnStep<Answer>(db: Database, step: (tx: Database) => Answer) {
  return db.transaction(async (tx) => step(tx));
}

async function addWriter(db: Database) {
  const kepala = await addTestActor(db, "Kepala Uji Tabel Kesehatan", [
    "head_of_unit",
  ]);
  const { studentIds } = await addTestStudents(
    db,
    "Prodi Uji Tabel Kesehatan",
    ["9986300001"],
  );
  const [studentId = ""] = studentIds;
  return { kepala, studentId };
}

async function addNote(db: Database, more: Partial<TestNote> = {}) {
  const { kepala, studentId } = await addWriter(db);
  const noteId = await addTestNote(db, kepala, {
    studentId,
    savedAt: new Date(),
    illnesses: [{ illness: "asthma", note: "sejak SMP" }],
    ...more,
  });
  return { kepala, studentId, noteId };
}

const LONG_SHORT_TEXT = "a".repeat(SHORT_TEXT_MAX + 1);

describe("a health note", () => {
  it("keeps short texts of 200 characters and advice of 2000", async () => {
    await inTestDatabase(async (db) => {
      const most = "a".repeat(SHORT_TEXT_MAX);
      const { noteId } = await addNote(db, {
        examiner: most,
        otherHistory: most,
        medicine: most,
        advice: "a".repeat(ADVICE_MAX),
        illnesses: [{ illness: "asthma", note: most }],
      });

      const kept = await db
        .select()
        .from(healthNotes)
        .where(eq(healthNotes.id, noteId));
      expect(kept).toHaveLength(1);
    });
  });

  it.each<[string, Partial<TestNote>]>([
    ["a Pemeriksa", { examiner: LONG_SHORT_TEXT }],
    ["a Riwayat lain", { otherHistory: LONG_SHORT_TEXT }],
    ["an Obat", { medicine: LONG_SHORT_TEXT }],
    ["a Catatan dan rekomendasi", { advice: "a".repeat(ADVICE_MAX + 1) }],
    [
      "an illness's note",
      { illnesses: [{ illness: "asthma", note: LONG_SHORT_TEXT }] },
    ],
  ])("is refused with %s too long", async (_, more) => {
    await inTestDatabase(async (db) => {
      await expect(inOwnStep(db, (tx) => addNote(tx, more))).rejects.toThrow();
    });
  });

  it("keeps an illness once in one note", async () => {
    await inTestDatabase(async (db) => {
      const { noteId } = await addNote(db);

      await expect(
        inOwnStep(db, (tx) =>
          tx
            .insert(healthNoteIllnesses)
            .values({ noteId, illness: "asthma", note: "" }),
        ),
      ).rejects.toThrow();
    });
  });

  it("cannot be changed, deleted or emptied, and neither can its illnesses", async () => {
    await inTestDatabase(async (db) => {
      const { noteId } = await addNote(db);
      const thisNote = eq(healthNotes.id, noteId);
      const ofNote = eq(healthNoteIllnesses.noteId, noteId);

      await expect(
        inOwnStep(db, (tx) =>
          tx.update(healthNotes).set({ advice: "Diubah." }).where(thisNote),
        ),
      ).rejects.toThrow();
      await expect(
        inOwnStep(db, (tx) => tx.delete(healthNotes).where(thisNote)),
      ).rejects.toThrow();
      await expect(
        inOwnStep(db, (tx) =>
          tx.update(healthNoteIllnesses).set({ note: "Diubah." }).where(ofNote),
        ),
      ).rejects.toThrow();
      await expect(
        inOwnStep(db, (tx) => tx.delete(healthNoteIllnesses).where(ofNote)),
      ).rejects.toThrow();
      await expect(
        inOwnStep(db, (tx) => tx.execute(sql`truncate health_note_illnesses`)),
      ).rejects.toThrow();
      await expect(
        db.execute(sql`truncate health_notes cascade`),
      ).rejects.toThrow();
    });
  });
});

describe("a reading of the health recap", () => {
  it("cannot be changed, deleted or emptied", async () => {
    await inTestDatabase(async (db) => {
      const { kepala } = await addWriter(db);
      const [reading] = await db
        .insert(healthRecapReadings)
        .values({
          readBy: kepala.id,
          readAt: new Date(),
          filters: {
            searched: false,
            residence: "all",
            category: "all",
            illness: "all",
            page: 1,
          },
        })
        .returning();
      if (!reading) throw new Error("The reading was not added.");
      const thisOne = eq(healthRecapReadings.id, reading.id);

      await expect(
        inOwnStep(db, (tx) =>
          tx
            .update(healthRecapReadings)
            .set({ readAt: new Date() })
            .where(thisOne),
        ),
      ).rejects.toThrow();
      await expect(
        inOwnStep(db, (tx) => tx.delete(healthRecapReadings).where(thisOne)),
      ).rejects.toThrow();
      await expect(
        db.execute(sql`truncate health_recap_readings`),
      ).rejects.toThrow();
    });
  });
});
