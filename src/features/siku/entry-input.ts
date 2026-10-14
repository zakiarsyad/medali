import { isDay } from "@/db/is-day";
import { isUuid } from "@/db/is-uuid";
import type { Parsed } from "@/parsed";
import {
  BASIS_MAX_LENGTH,
  ENTRY_NOTE_MAX_LENGTH,
  POINTS_MAX,
  POINTS_MIN,
  REASON_WITH_BASIS,
  reasonsOf,
  SIKU_KINDS,
  type SikuKind,
  type SikuReason,
  STUDENTS_MAX,
} from "./siku-ids";

/** A SIKU entry as the form sends it, every field as text. */
export interface SentEntry {
  kind: string;
  reason: string;
  points: string;
  day: string;
  note: string;
  basis: string;
  studentIds: string[];
}

/** A checked SIKU entry. */
export interface EntryInput {
  kind: SikuKind;
  reason: SikuReason;
  points: number;
  day: string;
  note: string;
  /** Empty for every reason but a decision of the Direktur. */
  basis: string;
  /** Each student once. */
  studentIds: string[];
}

export const NEEDS_STUDENT = "Pilih minimal satu mahasiswa.";
export const POINTS_OUTSIDE = `Poin ${POINTS_MIN}–${POINTS_MAX}.`;
export const NO_KIND = "Pilih Penambahan atau Pengurangan.";
export const NO_REASON = "Pilih alasan dari daftar.";
export const NO_DAY = "Isi tanggal.";
export const DAY_IN_FUTURE = "Tanggal tidak boleh setelah hari ini.";
export const NEEDS_BASIS = "Isi dasar atau nomor surat keputusan.";
export const BASIS_TOO_LONG = `Dasar atau nomor surat paling banyak ${BASIS_MAX_LENGTH} karakter.`;
export const NOTE_TOO_LONG = `Keterangan paling banyak ${ENTRY_NOTE_MAX_LENGTH} karakter.`;
export const TOO_MANY_STUDENTS = `Satu penyesuaian paling banyak untuk ${STUDENTS_MAX.toLocaleString("id-ID")} mahasiswa.`;

const WHOLE = /^\d{1,3}$/;

function refused(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

function kindOf(sent: string): SikuKind | null {
  return SIKU_KINDS.find((kind) => kind === sent) ?? null;
}

function reasonOf(kind: SikuKind, sent: string): SikuReason | null {
  return reasonsOf(kind).find((reason) => reason === sent) ?? null;
}

function pointsOf(sent: string): number | null {
  if (!WHOLE.test(sent)) return null;
  const points = Number(sent);
  if (points < POINTS_MIN || points > POINTS_MAX) return null;
  return points;
}

/** Each student once, or null when one sent is no student at all. */
function studentsOf(sent: string[]): string[] | null {
  if (!sent.every(isUuid)) return null;
  return [...new Set(sent)];
}

function basisOf(reason: SikuReason, sent: string): Parsed<string> {
  if (reason !== REASON_WITH_BASIS) return { ok: true, value: "" };
  const basis = sent.trim();
  if (basis === "") return refused(NEEDS_BASIS);
  if (basis.length > BASIS_MAX_LENGTH) return refused(BASIS_TOO_LONG);
  return { ok: true, value: basis };
}

/**
 * Checks a SIKU entry as sent, `today` being the day on campus. The
 * students come first and the points next, as the form says them.
 */
export function parseEntry(sent: SentEntry, today: string): Parsed<EntryInput> {
  const studentIds = studentsOf(sent.studentIds);
  if (studentIds === null || studentIds.length === 0) {
    return refused(NEEDS_STUDENT);
  }
  if (studentIds.length > STUDENTS_MAX) return refused(TOO_MANY_STUDENTS);
  const points = pointsOf(sent.points.trim());
  if (points === null) return refused(POINTS_OUTSIDE);
  const kind = kindOf(sent.kind);
  if (kind === null) return refused(NO_KIND);
  const reason = reasonOf(kind, sent.reason);
  if (reason === null) return refused(NO_REASON);
  if (!isDay(sent.day)) return refused(NO_DAY);
  if (sent.day > today) return refused(DAY_IN_FUTURE);
  const basis = basisOf(reason, sent.basis);
  if (!basis.ok) return basis;
  const note = sent.note.trim();
  if (note.length > ENTRY_NOTE_MAX_LENGTH) return refused(NOTE_TOO_LONG);
  return {
    ok: true,
    value: {
      kind,
      reason,
      points,
      day: sent.day,
      note,
      basis: basis.value,
      studentIds,
    },
  };
}
