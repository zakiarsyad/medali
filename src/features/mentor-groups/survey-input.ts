import { isDay } from "@/db/is-day";
import { isUuid } from "@/db/is-uuid";
import type { Parsed } from "@/parsed";
import { NOTE_MAX_LENGTH, scoreOf, typedNote } from "./evaluation-input";

/** "Buka periode evaluasi" as the form sends it. */
export interface SentSurveyPeriod {
  periodId: string;
  startsOn: string;
  endsOn: string;
  achievementWeight: string;
  note: string;
}

export interface SurveyPeriodInput {
  /** "Periode": the academic period the survey is about. */
  periodId: string;
  /** "Tanggal dibuka". */
  startsOn: string;
  /** "Tanggal ditutup". */
  endsOn: string;
  /** "Bobot capaian karakter (%)". */
  achievementWeight: number;
  /** Null for a period without a Keterangan. */
  note: string | null;
}

export const ASK_FOR_PERIOD = "Pilih periode dari daftar.";
export const ASK_FOR_DATES =
  "Isi tanggal dibuka dan tanggal ditutup dengan tanggal yang benar.";
export const ENDS_BEFORE_START =
  "Tanggal ditutup tidak boleh sebelum tanggal dibuka.";
export const END_HAS_PASSED =
  "Tanggal ditutup sudah lewat. Pilih hari ini atau tanggal sesudahnya.";
export const ASK_FOR_WEIGHT =
  "Isi bobot capaian karakter dengan bilangan bulat 0 sampai 100.";

function refused(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

/**
 * What is wrong with the two days of a period, or null: the last day is
 * not before the first, and has not passed on `today`.
 */
export function datesFault(
  startsOn: string,
  endsOn: string,
  today: string,
): string | null {
  if (endsOn < startsOn) return ENDS_BEFORE_START;
  if (endsOn < today) return END_HAS_PASSED;
  return null;
}

function parseNote(sent: string): Parsed<string | null> {
  const note = typedNote(sent);
  if (note.length > NOTE_MAX_LENGTH) {
    return refused(
      `Keterangan untuk mahasiswa paling panjang ${NOTE_MAX_LENGTH.toLocaleString("id-ID")} karakter.`,
    );
  }
  return { ok: true, value: note === "" ? null : note };
}

/**
 * Checks "Buka periode evaluasi" as sent, and says what is wrong: the
 * Periode and both dates must be there, the last day not before the
 * first and not passed on `today`, and the weight a whole number of 0 to
 * 100, never brought into range. Whether the Periode may be chosen and
 * whether another period runs is for the save to say, which reads both.
 */
export function parseSurveyPeriod(
  sent: SentSurveyPeriod,
  today: string,
): Parsed<SurveyPeriodInput> {
  if (!isUuid(sent.periodId)) return refused(ASK_FOR_PERIOD);
  if (!isDay(sent.startsOn) || !isDay(sent.endsOn)) {
    return refused(ASK_FOR_DATES);
  }
  const fault = datesFault(sent.startsOn, sent.endsOn, today);
  if (fault !== null) return refused(fault);
  const achievementWeight = scoreOf(sent.achievementWeight);
  if (achievementWeight === null) return refused(ASK_FOR_WEIGHT);
  const note = parseNote(sent.note);
  if (!note.ok) return note;
  return {
    ok: true,
    value: {
      periodId: sent.periodId,
      startsOn: sent.startsOn,
      endsOn: sent.endsOn,
      achievementWeight,
      note: note.value,
    },
  };
}
