import type { Database } from "@/db/connect";
import { healthNoteIllnesses, healthNotes } from "@/db/schema";
import type { Illness, NoteCategory } from "./health-ids";
import type { TestActor } from "./test-fitness";

/** Made-up health notes for the checks of this area. */

export interface TestNote {
  studentId: string;
  savedAt: Date;
  examinedOn?: string;
  examiner?: string | null;
  illnesses?: { illness: Illness; note: string }[];
  otherHistory?: string;
  medicine?: string;
  advice?: string;
  category?: NoteCategory | null;
}

/** A health note kept as it is, without the rules that check a sent form. */
export async function addTestNote(
  db: Database,
  by: Pick<TestActor, "id">,
  note: TestNote,
): Promise<string> {
  const id = crypto.randomUUID();
  await db.insert(healthNotes).values({
    id,
    studentId: note.studentId,
    examinedOn: note.examinedOn ?? "2026-10-12",
    examiner: note.examiner ?? null,
    otherHistory: note.otherHistory ?? "",
    medicine: note.medicine ?? "",
    advice: note.advice ?? "Kondisi umum baik.",
    category: note.category ?? null,
    savedBy: by.id,
    savedAt: note.savedAt,
  });
  const illnesses = note.illnesses ?? [];
  if (illnesses.length > 0) {
    await db
      .insert(healthNoteIllnesses)
      .values(illnesses.map((each) => ({ ...each, noteId: id })));
  }
  return id;
}
