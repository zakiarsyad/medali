import { desc, eq, inArray, type SQL } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { accounts, healthNoteIllnesses, healthNotes } from "@/db/schema";
import { type HealthNote, ILLNESSES, type NoteIllness } from "./health-ids";

/** A note with the student it is about. */
export interface StudentNote extends HealthNote {
  studentId: string;
}

/** The illnesses of each note, in the order "Riwayat penyakit" offers them. */
async function readIllnesses(
  db: Database,
  noteIds: string[],
): Promise<Map<string, NoteIllness[]>> {
  const byNote = new Map<string, NoteIllness[]>();
  if (noteIds.length === 0) return byNote;
  const rows = await db
    .select()
    .from(healthNoteIllnesses)
    .where(inArray(healthNoteIllnesses.noteId, noteIds));
  rows.sort(
    (a, b) => ILLNESSES.indexOf(a.illness) - ILLNESSES.indexOf(b.illness),
  );
  for (const { noteId, illness, note } of rows) {
    const picked = byNote.get(noteId) ?? [];
    picked.push({ illness, note });
    byNote.set(noteId, picked);
  }
  return byNote;
}

/**
 * The notes `where` lets through, newest first, each with its illnesses
 * and the name of who saved it. The caller decides who may read them.
 */
export async function readNotes(
  db: Database,
  where: SQL,
): Promise<StudentNote[]> {
  const rows = await db
    .select({
      id: healthNotes.id,
      studentId: healthNotes.studentId,
      examinedOn: healthNotes.examinedOn,
      examiner: healthNotes.examiner,
      otherHistory: healthNotes.otherHistory,
      medicine: healthNotes.medicine,
      advice: healthNotes.advice,
      category: healthNotes.category,
      savedBy: accounts.name,
    })
    .from(healthNotes)
    .innerJoin(accounts, eq(accounts.id, healthNotes.savedBy))
    .where(where)
    .orderBy(desc(healthNotes.savedAt), desc(healthNotes.id));
  const illnesses = await readIllnesses(
    db,
    rows.map((row) => row.id),
  );
  return rows.map((row) => ({
    ...row,
    illnesses: illnesses.get(row.id) ?? [],
  }));
}

/** These notes by their key, for a page that names its students' latest notes. */
export async function readNotesById(
  db: Database,
  noteIds: string[],
): Promise<Map<string, StudentNote>> {
  if (noteIds.length === 0) return new Map();
  const notes = await readNotes(db, inArray(healthNotes.id, noteIds));
  return new Map(notes.map((note) => [note.id, note]));
}
