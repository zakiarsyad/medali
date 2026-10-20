import { eq } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { violationNoteChanges, violationNotes } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { Parsed } from "@/parsed";
import { type NoteInput, parseNote, type SentNote } from "./note-input";
import {
  NOT_ALLOWED_TO_WRITE,
  NOT_WRITABLE,
  NOTE_ALREADY_SENT,
} from "./note-messages";
import { writableName } from "./note-student";
import { readNoteCategory } from "./placed-notes";
import type { NoteCategory } from "./violation-note-ids";

/** What "Simpan catatan" tells the one who saved. */
export interface SavedNote {
  name: string;
  category: NoteCategory;
}

type StoredNote = typeof violationNotes.$inferSelect;

/**
 * Whether the note kept under a key is the one this form added before:
 * by the same account, with every part the same. A form changed after it
 * was sent is not the same form: taking it for one would drop the change
 * while saying it was saved.
 */
function isSameNote(
  kept: StoredNote,
  actorId: string,
  input: NoteInput,
): boolean {
  return (
    kept.savedBy === actorId &&
    kept.studentId === input.studentId &&
    kept.day === input.day &&
    kept.description === input.description &&
    kept.punishment === input.punishment &&
    kept.otherPunishment === input.otherPunishment &&
    kept.remark === input.remark
  );
}

/** Adds the note with its log line, or finds it kept already. Whether it is this form's. */
async function keep(
  tx: Database,
  actorId: string,
  id: string,
  input: NoteInput,
  moment: Date,
): Promise<boolean> {
  // A second press waits here for the first to end, then adds nothing.
  const added = await tx
    .insert(violationNotes)
    .values({ ...input, id, savedBy: actorId, savedAt: moment })
    .onConflictDoNothing({ target: violationNotes.id })
    .returning({ id: violationNotes.id });
  if (added.length === 0) {
    const [kept] = await tx
      .select()
      .from(violationNotes)
      .where(eq(violationNotes.id, id));
    return kept !== undefined && isSameNote(kept, actorId, input);
  }
  await tx.insert(violationNoteChanges).values({
    noteId: id,
    changedBy: actorId,
    changedAt: WRITTEN_NOW,
    action: "added",
  });
  return true;
}

async function save(
  tx: Database,
  actor: AccountForAccess,
  id: string,
  input: NoteInput,
  moment: Date,
): Promise<Parsed<SavedNote>> {
  const name = await writableName(tx, actor, input.studentId);
  if (name === null) return NOT_WRITABLE;
  if (!(await keep(tx, actor.id, id, input, moment))) return NOTE_ALREADY_SENT;
  const category = await readNoteCategory(tx, id);
  // A note just kept is not removed, so it has a Kategori; this only
  // answers a removal by someone else between the two reads.
  if (category === null) return NOTE_ALREADY_SENT;
  return { ok: true, value: { name, category } };
}

/**
 * "Simpan catatan": keeps a violation note of an Aktif student as the
 * work of the actor, with a line in the log. Its semester is the
 * academic period its Tanggal falls in, and its Kategori is worked out
 * from the student's other notes of that semester. Refused, with nothing
 * kept, for a role without the right, for what the form rules refuse,
 * and for a student the actor may not write for. `id` is the key its
 * form made: a form sent twice is kept once, and the second press is
 * answered as the first.
 */
export async function saveViolationNote(
  db: Database,
  actor: AccountForAccess,
  id: string,
  sent: SentNote,
  moment: Date = new Date(),
): Promise<Parsed<SavedNote>> {
  if (!may(actor.roles, "write_violation_notes")) return NOT_ALLOWED_TO_WRITE;
  const periods = await readAcademicPeriods(db);
  const parsed = parseNote(sent, campusDay(moment), periods);
  if (!parsed.ok) return parsed;
  if (!isUuid(id)) return NOTE_ALREADY_SENT;
  const input = parsed.value;
  return db.transaction((tx) => save(tx, actor, id, input, moment));
}
