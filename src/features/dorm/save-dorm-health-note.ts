import { eq } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { healthNotes } from "@/db/schema";
import type { ShownCategory } from "@/health-notes/fitness-category";
import type { FitnessLimits } from "@/health-notes/fitness-ids";
import type { HealthNote } from "@/health-notes/health-ids";
import {
  NO_NOTE,
  type NoteInput,
  parseNote,
  type SentNote,
} from "@/health-notes/health-input";
import { readNotes } from "@/health-notes/health-notes-read";
import {
  holdHealthNotes,
  NOTE_ALREADY_SENT,
  type NotePlace,
  saveNote,
  saveNoteIn,
  writableName,
} from "@/health-notes/save-note";
import type { Parsed } from "@/parsed";
import { repeatsLatestNote, savesNote } from "./dorm-health-save-rules";
import { dormWritableFor } from "./dorm-health-subject";
import {
  filledMark,
  type MarkInput,
  parseMark,
  type SentMark,
  sameMark,
} from "./mental-health-mark-input";
import { NOT_ALLOWED_TO_MARK, UNKNOWN_MARK } from "./mental-health-mark-words";
import {
  isOwnStudent,
  keepMark,
  readLoggedChange,
  readStoredMark,
} from "./mental-health-marks";

export const NOT_ALLOWED_TO_WRITE_DORM = {
  ok: false,
  error:
    "Anda tidak berhak menulis catatan kesehatan. Catatan kesehatan penghuni asrama diisi oleh BAM - Kesehatan dan Kepala Unit Pembangunan Karakter.",
} as const;

/**
 * What a save answers for a student the account may not write a note
 * for here: one who is not Aktif, or lives in no dorm, whose notes are
 * written on Penilaian jasmani.
 */
export const NOT_A_RESIDENT = {
  ok: false,
  error:
    "Catatan tidak disimpan: mahasiswa ini bukan penghuni asrama aktif. Catatan kesehatan mahasiswa non asrama diisi di menu Penilaian > Penilaian jasmani.",
} as const;

/**
 * What a save answers for a mark of the account's own student: a
 * resident never sees nor sets their own mark.
 */
export const OWN_MARK = {
  ok: false,
  error:
    "Penanda potensi kesehatan mental tidak dapat diisi untuk diri Anda sendiri. Penanda Anda diisi oleh BAM - Kesehatan atau Kepala Unit Pembangunan Karakter yang lain.",
} as const;

/** Asrama > Kesehatan: Aktif dorm residents. */
const ASRAMA: NotePlace = {
  writable: dormWritableFor,
  notWritable: NOT_A_RESIDENT,
};

/** What a save on Asrama > Kesehatan kept. */
export interface DormHealthSaved {
  name: string;
  /** The student's category with the note kept, or null when no note was kept. */
  category: ShownCategory | null;
  /** Whether the save was of the mark "Potensi kesehatan mental" too. */
  markSaved: boolean;
}

/** One press of "Simpan catatan" with the mark, checked. */
interface CheckedSave {
  key: string;
  studentId: string;
  /** Null for a note part with no illness and no text. */
  note: NoteInput | null;
  mark: MarkInput;
  /** Whether the person changed the mark the form was filled with. */
  markTouched: boolean;
}

/** What a save does with the mark. */
interface MarkStep {
  before: MarkInput;
  /** The mark is written, with a line in the log. */
  changes: boolean;
  /** The save is of the mark: it changes now, or this form changed it before. */
  decides: boolean;
}

/**
 * What a save does with the mark. A mark the person left as the form
 * was filled is left alone, whatever another writer stored meanwhile; a
 * mark they changed is written, unless it equals the stored one or this
 * form's key logged it already. A key that logged another change, of
 * another student or to another mark, is a form sent before and changed
 * since: refused, as a note is.
 */
async function markStepOf(
  tx: Database,
  save: CheckedSave,
): Promise<Parsed<MarkStep>> {
  const before = await readStoredMark(tx, save.studentId);
  const logged = await readLoggedChange(tx, save.key);
  if (logged !== null) {
    const isThisChange =
      logged.studentId === save.studentId && sameMark(logged.after, save.mark);
    if (!isThisChange) return NOTE_ALREADY_SENT;
    return { ok: true, value: { before, changes: false, decides: true } };
  }
  const changes = save.markTouched && !sameMark(before, save.mark);
  return { ok: true, value: { before, changes, decides: changes } };
}

async function latestNoteOf(
  tx: Database,
  studentId: string,
): Promise<HealthNote | undefined> {
  const [latest] = await readNotes(tx, eq(healthNotes.studentId, studentId));
  return latest;
}

/** Whether the note part, when there is one, is the latest note untouched. */
async function repeatsLatest(
  tx: Database,
  save: CheckedSave,
): Promise<boolean> {
  if (save.note === null) return false;
  return repeatsLatestNote(save.note, await latestNoteOf(tx, save.studentId));
}

async function saveWithMarkIn(
  tx: Database,
  actor: AccountForAccess,
  save: CheckedSave,
  limits: FitnessLimits,
  day: string,
): Promise<Parsed<DormHealthSaved>> {
  await holdHealthNotes(tx);
  const writable = await dormWritableFor(tx, actor, day);
  const name = await writableName(tx, writable, save.studentId);
  if (name === null) return NOT_A_RESIDENT;
  const step = await markStepOf(tx, save);
  if (!step.ok) return step;
  const { before, changes: markChanges, decides: markDecides } = step.value;
  const keepsNote = savesNote({
    noteEmpty: save.note === null,
    repeatsLatest: markDecides && (await repeatsLatest(tx, save)),
    markDecides,
  });
  if (!keepsNote && !markDecides) return { ok: false, error: NO_NOTE };
  let category: ShownCategory | null = null;
  if (keepsNote && save.note !== null) {
    const { key, note } = save;
    const saved = await saveNoteIn(tx, actor, key, note, limits, ASRAMA, day);
    if (!saved.ok) return saved;
    category = saved.value.category;
  }
  if (markChanges) {
    const { key, studentId, mark: after } = save;
    await keepMark(tx, actor.id, { key, studentId, before, after });
  }
  return { ok: true, value: { name, category, markSaved: markDecides } };
}

async function saveWithMark(
  db: Database,
  actor: AccountForAccess,
  key: string,
  sent: SentNote,
  sentMark: SentMark,
  limits: FitnessLimits,
  moment: Date,
): Promise<Parsed<DormHealthSaved>> {
  if (!may(actor.roles, "write_mental_health_marks")) {
    return { ok: false, error: NOT_ALLOWED_TO_MARK };
  }
  if (isOwnStudent(actor, sent.studentId)) return OWN_MARK;
  const mark = parseMark(sentMark);
  if (!mark.ok) return mark;
  const filled = filledMark(sentMark);
  if (filled === null) return { ok: false, error: UNKNOWN_MARK };
  const day = campusDay(moment);
  const note = parseNote(sent, day);
  const noteEmpty = !note.ok && note.error === NO_NOTE;
  if (!note.ok && !noteEmpty) return note;
  if (!isUuid(key)) return NOTE_ALREADY_SENT;
  if (!isUuid(sent.studentId)) return NOT_A_RESIDENT;
  const save: CheckedSave = {
    key,
    studentId: sent.studentId,
    note: note.ok ? note.value : null,
    mark: mark.value,
    markTouched: !sameMark(mark.value, filled),
  };
  return db.transaction((tx) => saveWithMarkIn(tx, actor, save, limits, day));
}

/**
 * "Simpan catatan" on Asrama > Kesehatan: keeps a health note of an
 * Aktif dorm resident, as the work of the actor, and with `mark` sets
 * their mark "Potensi kesehatan mental" too, when the person changed it
 * and it is not their own. A mark is saved with no
 * illness or note, and then no note is kept; so is a mark set on a form
 * still filled with the latest note. A mark that does not change is not
 * written again. Refused, with nothing kept, for a role without the
 * right to write residents' notes or to mark, for a referral to the
 * counsellor with no observation, and as saveNote refuses. `id` is the
 * key its form made: a form sent twice is kept once.
 */
export async function saveDormHealthNote(
  db: Database,
  actor: AccountForAccess,
  id: string,
  sent: SentNote,
  limits: FitnessLimits,
  moment: Date = new Date(),
  mark: SentMark | null = null,
): Promise<Parsed<DormHealthSaved>> {
  if (!may(actor.roles, "write_dorm_health_notes")) {
    return NOT_ALLOWED_TO_WRITE_DORM;
  }
  if (mark !== null) {
    return saveWithMark(db, actor, id, sent, mark, limits, moment);
  }
  const saved = await saveNote(db, actor, id, sent, limits, ASRAMA, moment);
  if (!saved.ok) return saved;
  return { ok: true, value: { ...saved.value, markSaved: false } };
}
