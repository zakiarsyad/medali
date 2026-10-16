import { and, eq, sql } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { healthNoteIllnesses, healthNotes, students } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { Parsed } from "@/parsed";
import type { ShownCategory } from "./fitness-category";
import type { FitnessLimits } from "./fitness-ids";
import { finalCategory } from "./health-category";
import { type NoteInput, parseNote, type SentNote } from "./health-input";
import { dormCohortsOn, readTestCategory, writableFor } from "./health-subject";

/** What a kept note answers: the student's name and their category now. */
export interface SavedNote {
  name: string;
  category: ShownCategory;
}

export const NOT_ALLOWED_TO_WRITE = {
  ok: false,
  error:
    "Anda tidak berhak menulis catatan kesehatan. Catatan kesehatan mahasiswa non asrama diisi oleh Kepala Unit Pembangunan Karakter dan Penilai Mahasiswa.",
} as const;

/**
 * What a save answers for a student the account may not write a note
 * for here: one who is not Aktif, is outside its students, or lives in
 * the dorm, whose notes are written on Asrama > Kesehatan.
 */
export const NOT_WRITABLE = {
  ok: false,
  error:
    "Catatan tidak disimpan: mahasiswa ini tidak dapat dipilih di sini. Catatan kesehatan penghuni asrama diisi di menu Asrama > Kesehatan.",
} as const;

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

/** The name of the student when the account may write a note for them, or null. */
async function writableName(
  tx: Database,
  actor: AccountForAccess,
  studentId: string,
  day: string,
): Promise<string | null> {
  const writable = writableFor(actor, await dormCohortsOn(tx, day));
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

async function save(
  tx: Database,
  actor: AccountForAccess,
  id: string,
  input: NoteInput,
  limits: FitnessLimits,
  day: string,
): Promise<Parsed<SavedNote>> {
  // Every save waits here for the one before it to end. A second press
  // then finds the key it used, and of two saves at once the later is
  // stamped by the database clock after the sooner, so it counts.
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext('health_notes'))`);
  const name = await writableName(tx, actor, input.studentId, day);
  if (name === null) return NOT_WRITABLE;
  if (!(await keep(tx, actor, id, input))) return NOTE_ALREADY_SENT;
  const test = await readTestCategory(tx, input.studentId, limits);
  const { category } = finalCategory(test, input.category);
  return { ok: true, value: { name, category } };
}

/**
 * "Simpan catatan": keeps a health note of an Aktif student who lives in
 * no dorm, as the work of the actor. Each note is its own line in the
 * log: it can never be changed or deleted, and a student's note saved
 * last counts. Refused, with nothing kept, for a role without the right
 * "Penilaian jasmani", for what the form rules refuse, and for any
 * student the account may not write a note for here. `id` is the key its
 * form made: a form sent twice is kept once, and the second press is
 * answered as the first. Gives the student's name and their category
 * with the note, worked out with the limits given.
 */
export async function saveHealthNote(
  db: Database,
  actor: AccountForAccess,
  id: string,
  sent: SentNote,
  limits: FitnessLimits,
  moment: Date = new Date(),
): Promise<Parsed<SavedNote>> {
  if (!may(actor.roles, "enter_fitness_scores")) return NOT_ALLOWED_TO_WRITE;
  const day = campusDay(moment);
  const parsed = parseNote(sent, day);
  if (!parsed.ok) return parsed;
  if (!isUuid(id)) return NOTE_ALREADY_SENT;
  if (!isUuid(sent.studentId)) return NOT_WRITABLE;
  const input = parsed.value;
  return db.transaction((tx) => save(tx, actor, id, input, limits, day));
}
