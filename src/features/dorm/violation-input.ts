import { campusDay } from "@/academic-periods/campus-day";
import { daysAfter } from "@/academic-periods/days-after";
import { isDay } from "@/db/is-day";
import { isUuid } from "@/db/is-uuid";
import type { Parsed } from "@/parsed";
import { momentOf } from "./leave-time";
import {
  OTHER_PUNISHMENT_MAX_LENGTH,
  PUNISHMENTS,
  type Punishment,
  REASON_MAX_LENGTH,
  REASON_MIN_LENGTH,
  VIOLATIONS_PER_SAVE_MAX,
} from "./violation-ids";

/*
 * The checks of "Tambahkan ke daftar" and of "Simpan dan jadwalkan
 * publikasi". Read by the screen parts in the browser, so nothing here
 * may take from the database code.
 */

/** One row of the list, as the form sends it, every field as text. */
export interface SentViolationRow {
  studentId: string;
  reason: string;
  punishment: string;
  otherPunishment: string;
}

/** The whole list with its days, as the form sends it. */
export interface SentViolations {
  day: string;
  announceDay: string;
  announceTime: string;
  rows: SentViolationRow[];
}

export interface ViolationRowInput {
  studentId: string;
  reason: string;
  punishment: Punishment;
  /** Empty for every punishment but Hukuman lainnya. */
  otherPunishment: string;
}

export interface ViolationsInput {
  day: string;
  /** The announcement hour as sent, before a passed one becomes `now`. */
  requestedAt: Date;
  announcedAt: Date;
  rows: ViolationRowInput[];
}

/** How many days after today an announcement may be set. */
const ANNOUNCEMENT_DAYS_AHEAD = 7;

export const NEEDS_STUDENT = "Pilih mahasiswa.";
export const NEEDS_REASON = `Isi alasan pelanggaran, minimal ${REASON_MIN_LENGTH} huruf.`;
export const REASON_TOO_LONG = `Alasan pelanggaran paling banyak ${REASON_MAX_LENGTH} karakter.`;
export const NEEDS_PUNISHMENT = "Pilih jenis hukuman dari daftar.";
export const NEEDS_OTHER_PUNISHMENT = "Sebutkan hukuman lainnya.";
export const OTHER_PUNISHMENT_TOO_LONG = `Hukuman lainnya paling banyak ${OTHER_PUNISHMENT_MAX_LENGTH} karakter.`;
export const NOT_FOR_YOURSELF =
  "Anda tidak dapat mencatat pelanggaran untuk diri sendiri.";
export const NO_DAY = "Isi tanggal pelanggaran.";
export const DAY_IN_FUTURE =
  "Tanggal pelanggaran tidak boleh setelah hari ini.";
export const ANNOUNCEMENT_MISSING = "Lengkapi tanggal dan jam pengumuman.";
export const ANNOUNCED_BEFORE_DAY =
  "Tanggal pengumuman tidak boleh sebelum tanggal pelanggaran.";
export const ANNOUNCEMENT_TOO_FAR = `Tanggal pengumuman paling lambat ${ANNOUNCEMENT_DAYS_AHEAD} hari setelah hari ini.`;
export const NEEDS_ROWS = "Belum ada pelanggaran di daftar.";
export const TOO_MANY_ROWS = `Satu kali simpan paling banyak ${VIOLATIONS_PER_SAVE_MAX} pelanggaran.`;

function refused(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

function punishmentOf(sent: string): Punishment | null {
  return PUNISHMENTS.find((punishment) => punishment === sent) ?? null;
}

function otherPunishmentOf(
  punishment: Punishment,
  sent: string,
): Parsed<string> {
  if (punishment !== "other") return { ok: true, value: "" };
  const other = sent.trim();
  if (other === "") return refused(NEEDS_OTHER_PUNISHMENT);
  if (other.length > OTHER_PUNISHMENT_MAX_LENGTH) {
    return refused(OTHER_PUNISHMENT_TOO_LONG);
  }
  return { ok: true, value: other };
}

/**
 * Checks one row of the list. `ownStudentId` is the student of the
 * account that records it, or null for an account that is no student:
 * nobody records a violation of their own.
 */
export function parseViolationRow(
  sent: SentViolationRow,
  ownStudentId: string | null,
): Parsed<ViolationRowInput> {
  if (!isUuid(sent.studentId)) return refused(NEEDS_STUDENT);
  if (sent.studentId === ownStudentId) return refused(NOT_FOR_YOURSELF);
  const reason = sent.reason.trim();
  if (reason.length < REASON_MIN_LENGTH) return refused(NEEDS_REASON);
  if (reason.length > REASON_MAX_LENGTH) return refused(REASON_TOO_LONG);
  const punishment = punishmentOf(sent.punishment);
  if (punishment === null) return refused(NEEDS_PUNISHMENT);
  const other = otherPunishmentOf(punishment, sent.otherPunishment);
  if (!other.ok) return other;
  return {
    ok: true,
    value: {
      studentId: sent.studentId,
      reason,
      punishment,
      otherPunishment: other.value,
    },
  };
}

/** The announcement hour as sent, on campus. */
function announcementOf(
  sent: SentViolations,
  day: string,
  now: Date,
): Parsed<Date> {
  const at = momentOf(`${sent.announceDay}T${sent.announceTime}`);
  if (at === null) return refused(ANNOUNCEMENT_MISSING);
  if (sent.announceDay < day) return refused(ANNOUNCED_BEFORE_DAY);
  const lastDay = daysAfter(campusDay(now), ANNOUNCEMENT_DAYS_AHEAD);
  if (sent.announceDay > lastDay) return refused(ANNOUNCEMENT_TOO_FAR);
  return { ok: true, value: at };
}

function rowsOf(
  sent: SentViolationRow[],
  ownStudentId: string | null,
): Parsed<ViolationRowInput[]> {
  if (sent.length === 0) return refused(NEEDS_ROWS);
  if (sent.length > VIOLATIONS_PER_SAVE_MAX) return refused(TOO_MANY_ROWS);
  const rows: ViolationRowInput[] = [];
  for (const each of sent) {
    const parsed = parseViolationRow(each, ownStudentId);
    if (!parsed.ok) return parsed;
    rows.push(parsed.value);
  }
  return { ok: true, value: rows };
}

/**
 * Checks the whole list as sent, at `now` by the server's clock. One row
 * refused refuses all of them. The announcement is at `now` or later: an
 * hour that has passed means the violations are announced as they are
 * saved.
 */
export function parseViolations(
  sent: SentViolations,
  now: Date,
  ownStudentId: string | null,
): Parsed<ViolationsInput> {
  if (!isDay(sent.day)) return refused(NO_DAY);
  if (sent.day > campusDay(now)) return refused(DAY_IN_FUTURE);
  const requested = announcementOf(sent, sent.day, now);
  if (!requested.ok) return requested;
  const rows = rowsOf(sent.rows, ownStudentId);
  if (!rows.ok) return rows;
  const requestedAt = requested.value;
  return {
    ok: true,
    value: {
      day: sent.day,
      requestedAt,
      announcedAt: requestedAt < now ? now : requestedAt,
      rows: rows.value,
    },
  };
}
