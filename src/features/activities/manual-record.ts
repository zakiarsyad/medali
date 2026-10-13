import type { Parsed } from "@/parsed";
import type { FormState } from "@/ui/form-message";
import { ATTENDANCE_WORDS, type AttendanceStatus } from "./attendance-status";

/*
 * The rules of an attendance recorded by hand, apart from the database
 * and from how its form is drawn, so they can be checked alone. Read by
 * the form in the browser: nothing here may take from the database code.
 */

/** What Pegawai UPK records by hand: present, or excused for a reason. */
export const RECORD_KINDS = ["present", "leave", "sick"] as const;

export type RecordKind = (typeof RECORD_KINDS)[number];

export const RECORD_KIND_WORDS: Record<RecordKind, string> = {
  present: "Hadir (dicatat manual)",
  leave: "Dispensasi: izin",
  sick: "Dispensasi: sakit",
};

/** How each kind starts its Keterangan, as the history shows it. */
const NOTE_STARTS: Record<RecordKind, string> = {
  present: "Dicatat manual.",
  leave: "Izin.",
  sick: "Sakit.",
};

export const RECORD_NOTE_MAX = 200;

export const NO_STUDENT_PICKED = "Pilih mahasiswa.";
export const NO_ACTIVITY_PICKED = "Pilih kegiatan.";
export const NO_KIND_PICKED = "Pilih status kehadiran.";
export const NO_DISPENSATION_NOTE = "Isi keterangan dispensasi.";
export const NOTE_TOO_LONG = `Keterangan paling banyak ${RECORD_NOTE_MAX} karakter.`;
export const STUDENT_NOT_FOUND =
  "Mahasiswa aktif ini tidak ditemukan. Cari lagi, lalu pilih dari hasil pencarian.";
export const ACTIVITY_NOT_FOUND =
  "Kegiatan ini tidak ada dalam jadwal mahasiswa tersebut atau belum dimulai. Pilih kegiatan dari daftar.";
export const STATUS_JUST_CHANGED =
  "Status kehadiran baru saja berubah. Tekan Simpan lagi.";
export const RECORD_NOT_SENT =
  "Catatan tidak terkirim. Periksa koneksi internet, lalu coba lagi.";

/** A student whose attendance can be recorded by hand, as the search offers them. */
export interface RecordStudent {
  id: string;
  name: string;
  nim: string;
  program: string;
}

/** A schedule an attendance can be recorded for, as the list names it. */
export interface RecordActivity {
  id: string;
  /** Its first day, its name and its semester. */
  words: string;
  /** Where the student's newest attendance at it stands, or null with none. */
  status: AttendanceStatus | null;
}

/**
 * What the form sends as it arrives: a hand-made request may send
 * anything in its place, and then every part counts as not sent.
 */
export function sentRecord(sent: unknown): SentRecord {
  const parts: Partial<SentRecord> =
    typeof sent === "object" && sent !== null ? sent : {};
  const { studentId, scheduleId, kind, note, replaces } = parts;
  return { studentId, scheduleId, kind, note, replaces };
}

/** What is kept of a record made by hand. */
export interface ManualRecord {
  status: Extract<AttendanceStatus, "valid" | "dispensation">;
  /** The Keterangan as it is stored. */
  note: string;
}

/** What the form sends. Nothing of it is trusted. */
export interface SentRecord {
  studentId: unknown;
  scheduleId: unknown;
  kind: unknown;
  note: unknown;
  /** The status the person agreed to replace, or null when none. */
  replaces: unknown;
}

/**
 * What saving a record answers: the words to show, and the status the
 * student already has when that must be agreed to first, or null.
 */
export interface RecordAnswer {
  state: FormState;
  confirm: AttendanceStatus | null;
}

function isKind(kind: unknown): kind is RecordKind {
  return RECORD_KINDS.some((each) => each === kind);
}

/** The Keterangan as stored: how the kind starts it, then what was typed. */
export function storedNote(kind: RecordKind, typed: string): string {
  const start = NOTE_STARTS[kind];
  return typed === "" ? start : `${start} ${typed}`;
}

/**
 * The record a kind and a Keterangan make. A dispensation needs its
 * Keterangan, such as the number of the letter.
 */
export function parseRecord(
  kind: unknown,
  note: unknown,
): Parsed<ManualRecord> {
  if (!isKind(kind)) return { ok: false, error: NO_KIND_PICKED };
  const typed = typeof note === "string" ? note.trim() : "";
  if (typed.length > RECORD_NOTE_MAX)
    return { ok: false, error: NOTE_TOO_LONG };
  const isPresent = kind === "present";
  if (!isPresent && typed === "") {
    return { ok: false, error: NO_DISPENSATION_NOTE };
  }
  return {
    ok: true,
    value: {
      status: isPresent ? "valid" : "dispensation",
      note: storedNote(kind, typed),
    },
  };
}

/**
 * Whether the person must first agree to replace a status: the student
 * has one, and it is not the one they agreed to. So a status that
 * changed since they agreed is asked about again.
 */
export function mustConfirm(
  current: AttendanceStatus | null,
  agreed: unknown,
): boolean {
  return current !== null && agreed !== current;
}

export function confirmWords(name: string, status: AttendanceStatus): string {
  return `${name} sudah berstatus ${ATTENDANCE_WORDS[status]} pada kegiatan ini. Tekan Simpan lagi untuk menggantinya.`;
}

export function recordedWords(name: string): string {
  return `Kehadiran ${name} dicatat.`;
}
