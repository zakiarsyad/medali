import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { runningPeriodOn } from "@/academic-periods/running-period";
import { isDay } from "@/db/is-day";
import { isUuid } from "@/db/is-uuid";
import type { Parsed } from "@/parsed";
import {
  DESCRIPTION_MAX_LENGTH,
  DESCRIPTION_MIN_LENGTH,
  NOTE_PUNISHMENTS,
  type NotePunishment,
  OTHER_PUNISHMENT_MAX_LENGTH,
  REMARK_MAX_LENGTH,
} from "./violation-note-ids";

/*
 * The checks of "Simpan catatan". Read by the screen parts in the
 * browser, so nothing here may take from the database code.
 */

/** A note as the form sends it, every field as text. */
export interface SentNote {
  studentId: string;
  day: string;
  description: string;
  punishment: string;
  otherPunishment: string;
  remark: string;
}

export interface NoteInput {
  studentId: string;
  day: string;
  description: string;
  punishment: NotePunishment;
  /** Empty for every punishment but Hukuman lainnya. */
  otherPunishment: string;
  remark: string;
}

export const NEEDS_STUDENT = "Pilih mahasiswa.";
export const NO_DAY = "Isi tanggal pelanggaran.";
export const DAY_IN_FUTURE =
  "Tanggal pelanggaran tidak boleh setelah hari ini.";
export const DAY_IN_NO_PERIOD =
  "Tanggal pelanggaran tidak masuk periode akademik mana pun. Periksa tanggalnya, atau minta Kepala Unit menambahkan periode akademiknya.";
export const NEEDS_DESCRIPTION = `Isi uraian pelanggaran, minimal ${DESCRIPTION_MIN_LENGTH} huruf.`;
export const DESCRIPTION_TOO_LONG = `Uraian pelanggaran paling banyak ${DESCRIPTION_MAX_LENGTH} karakter.`;
export const NEEDS_PUNISHMENT = "Pilih jenis hukuman dari daftar.";
export const NEEDS_OTHER_PUNISHMENT = "Sebutkan hukuman lainnya.";
export const OTHER_PUNISHMENT_TOO_LONG = `Hukuman lainnya paling banyak ${OTHER_PUNISHMENT_MAX_LENGTH} karakter.`;
export const REMARK_TOO_LONG = `Keterangan paling banyak ${REMARK_MAX_LENGTH} karakter.`;

function refused(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

function punishmentOf(sent: string): NotePunishment | null {
  return NOTE_PUNISHMENTS.find((punishment) => punishment === sent) ?? null;
}

function otherPunishmentOf(
  punishment: NotePunishment,
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
 * Why a Tanggal cannot be kept, or null when it can: it is a day, not
 * after today, and falls in an academic period, the one "Academic
 * period" gives for it.
 */
function dayRefusal(
  day: string,
  today: string,
  periods: readonly Pick<AcademicPeriod, "startsOn">[],
): string | null {
  if (!isDay(day)) return NO_DAY;
  if (day > today) return DAY_IN_FUTURE;
  if (runningPeriodOn(periods, day) === null) return DAY_IN_NO_PERIOD;
  return null;
}

/**
 * Checks a note as sent, on `today` on campus, with the stored academic
 * periods.
 */
export function parseNote(
  sent: SentNote,
  today: string,
  periods: readonly Pick<AcademicPeriod, "startsOn">[],
): Parsed<NoteInput> {
  if (!isUuid(sent.studentId)) return refused(NEEDS_STUDENT);
  const dayError = dayRefusal(sent.day, today, periods);
  if (dayError !== null) return refused(dayError);
  const description = sent.description.trim();
  if (description.length < DESCRIPTION_MIN_LENGTH) {
    return refused(NEEDS_DESCRIPTION);
  }
  if (description.length > DESCRIPTION_MAX_LENGTH) {
    return refused(DESCRIPTION_TOO_LONG);
  }
  const punishment = punishmentOf(sent.punishment);
  if (punishment === null) return refused(NEEDS_PUNISHMENT);
  const other = otherPunishmentOf(punishment, sent.otherPunishment);
  if (!other.ok) return other;
  const remark = sent.remark.trim();
  if (remark.length > REMARK_MAX_LENGTH) return refused(REMARK_TOO_LONG);
  return {
    ok: true,
    value: {
      studentId: sent.studentId,
      day: sent.day,
      description,
      punishment,
      otherPunishment: other.value,
      remark,
    },
  };
}
