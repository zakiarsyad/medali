import { and, eq, type SQL, sql } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { healthNoteIllnesses, healthNotes, students } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { Parsed } from "@/parsed";
import type { ShownCategory } from "./fitness-category";
import type { FitnessLimits } from "./fitness-ids";
import { finalCategory } from "./health-category";
import { type NoteInput, parseNote, type SentNote } from "./health-input";
import { readTestCategory } from "./note-subject";

/** What a kept note answers: the student's name and their category now. */
export interface SavedNote {
  name: string;
  category: ShownCategory;
}

/** A refused save, in the words the form shows. */
export interface Refused {
  ok: false;
  error: string;
}

/**
 * Where a note is saved: the students the actor may write a note for
 * there on a day, and what a save answers for any other student.
 */
export interface NotePlace {
  writable: (
    db: Database,
    actor: AccountForAccess,
    day: string,
  ) => Promise<SQL | undefined>;
  notWritable: Refused;
}

/**
 * What a save answers when its key is that of a note it did not just
 * add: the form was sent before and changed since, or the key is not
 * its own.
 */
export const NOTE_ALREADY_SENT = {
  ok: false,
  error:
    "Formulir ini sudah pernah terkirim, jadi isian yang sekarang tidak disimpan. Muat ulang halaman, pilih mahasiswa lagi, lalu simpan bila masih perlu.",
} as const;

type StoredNote = typeof healthNotes.$inferSelect;

function sortedIllnesses(illnesses: NoteInput["illnesses"]): string {
  return illnesses
    .map((each) => `${each.illness}:${each.note}`)
    .sort()
    .join("\n");
}

/**
 * Whether the note kept under a key is the one this form added before:
 * by the same account, with every part the same. A form changed after it
 * was sent is not the same form: taking it for one would drop the change
 * while saying it was saved.
 */
async function isSameNote(
  tx: Database,
  kept: StoredNote,
  actorId: string,
  input: NoteInput,
): Promise<boolean> {
  const isSame =
    kept.savedBy === actorId &&
    kept.studentId === input.studentId &&
    kept.examinedOn === input.examinedOn &&
    kept.examiner === input.examiner &&
    kept.otherHistory === input.otherHistory &&
    kept.medicine === input.medicine &&
    kept.advice === input.advice &&
    kept.category === input.category;
  if (!isSame) return false;
  const keptIllnesses = await tx
    .select({
      illness: healthNoteIllnesses.illness,
      note: healthNoteIllnesses.note,
    })
    .from(healthNoteIllnesses)
    .where(eq(healthNoteIllnesses.noteId, kept.id));
  return sortedIllnesses(keptIllnesses) === sortedIllnesses(input.illnesses);
}

/** The name of the student when `writable` lets them through, or null. */
export async function writableName(
  tx: Database,
  writable: SQL | undefined,
  studentId: string,
): Promise<string | null> {
  const [student] = await tx
    .select({ name: students.name })
    .from(students)
    .where(and(eq(students.id, studentId), writable));
  return student?.name ?? null;
}

/** Adds the note, or finds it kept already. Whether it is this form's. */
async function keep(
  tx: Database,
  actor: AccountForAccess,
  id: string,
  input: NoteInput,
): Promise<boolean> {
  const { illnesses, ...note } = input;
  const added = await tx
    .insert(healthNotes)
    .values({ ...note, id, savedBy: actor.id, savedAt: WRITTEN_NOW })
    .onConflictDoNothing({ target: healthNotes.id })
    .returning({ id: healthNotes.id });
  if (added.length === 0) {
    const [kept] = await tx
      .select()
      .from(healthNotes)
      .where(eq(healthNotes.id, id));
    return kept !== undefined && (await isSameNote(tx, kept, actor.id, input));
  }
  if (illnesses.length > 0) {
    await tx
      .insert(healthNoteIllnesses)
      .values(illnesses.map((each) => ({ ...each, noteId: id })));
  }
  return true;
}

/**
 * Makes every save of a health note wait here, until the transaction
 * ends, for the one before it to end. A second press then finds the key
 * it used, and of two saves at once the later is stamped by the database
 * clock after the sooner, so it counts.
 */
export async function holdHealthNotes(tx: Database): Promise<void> {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext('health_notes'))`);
}

/**
 * saveNote within a transaction the caller holds, for a note already
 * checked.
 */
export async function saveNoteIn(
  tx: Database,
  actor: AccountForAccess,
  id: string,
  input: NoteInput,
  limits: FitnessLimits,
  place: NotePlace,
  day: string,
): Promise<Parsed<SavedNote>> {
  await holdHealthNotes(tx);
  const writable = await place.writable(tx, actor, day);
  const name = await writableName(tx, writable, input.studentId);
  if (name === null) return place.notWritable;
  if (!(await keep(tx, actor, id, input))) return NOTE_ALREADY_SENT;
  const test = await readTestCategory(tx, input.studentId, limits);
  const { category } = finalCategory(test, input.category);
  return { ok: true, value: { name, category } };
}

/**
 * "Simpan catatan": keeps a health note as the work of the actor, of a
 * student the place lets the actor write for. Each note is its own line
 * in the log: it can never be changed or deleted, and a student's note
 * saved last counts. Refused, with nothing kept, for what the form rules
 * refuse and for any other student. `id` is the key its form made: a
 * form sent twice is kept once, and the second press is answered as the
 * first. Gives the student's name and their category with the note,
 * worked out with the limits given. The caller checks the actor's right
 * to write first.
 */
export async function saveNote(
  db: Database,
  actor: AccountForAccess,
  id: string,
  sent: SentNote,
  limits: FitnessLimits,
  place: NotePlace,
  moment: Date,
): Promise<Parsed<SavedNote>> {
  const day = campusDay(moment);
  const parsed = parseNote(sent, day);
  if (!parsed.ok) return parsed;
  if (!isUuid(id)) return NOTE_ALREADY_SENT;
  if (!isUuid(sent.studentId)) return place.notWritable;
  const input = parsed.value;
  return db.transaction((tx) =>
    saveNoteIn(tx, actor, id, input, limits, place, day),
  );
}
