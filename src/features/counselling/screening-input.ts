import { isDay } from "@/db/is-day";
import { isUuid } from "@/db/is-uuid";
import {
  DASS_SUM_MAX,
  INSTRUMENTS,
  type Instrument,
  SCREENING_NOTE_MAX,
  SRQ_MAX,
} from "@/mental-health/screening-ids";
import {
  DASS_SCALES,
  type DassScale,
  type ScreeningScores,
} from "@/mental-health/screening-rules";
import {
  DATE_MISSING,
  FUTURE_DATE,
  NOTE_TOO_LONG,
  PICK_STUDENT,
  SCALE_WORDS,
  SRQ_FIELD,
  scoreOutOfRange,
  UNKNOWN_INSTRUMENT,
} from "@/mental-health/screening-words";
import type { Parsed } from "@/parsed";

/*
 * How a sent screening is checked. Read by the form in the browser and by
 * the server, which checks again what is sent, so nothing here may take
 * from the database code.
 */

/** A screening as the form sends it; the sums are the typed texts. */
export interface SentScreening {
  studentId: string;
  screenedOn: string;
  instrument: string;
  depression: string;
  anxiety: string;
  stress: string;
  srqYes: string;
  selfHarm: boolean;
  note: string;
}

/** The part of a sent screening that gives its level. */
export type SentScores = Pick<
  SentScreening,
  "instrument" | "depression" | "anxiety" | "stress" | "srqYes" | "selfHarm"
>;

/** A screening as the server keeps it. */
export interface CheckedScreening {
  studentId: string;
  screenedOn: string;
  scores: ScreeningScores;
  note: string;
}

const WHOLE_NUMBER = /^\d{1,2}$/;

/** A typed sum from 0 to `most`, or null for anything else. */
function sumWithin(sent: unknown, most: number): number | null {
  if (typeof sent !== "string") return null;
  const text = sent.trim();
  if (!WHOLE_NUMBER.test(text)) return null;
  const sum = Number(text);
  return sum <= most ? sum : null;
}

function isInstrument(sent: unknown): sent is Instrument {
  return INSTRUMENTS.some((instrument) => instrument === sent);
}

function checkDass(sent: SentScores): Parsed<ScreeningScores> {
  const sums: Partial<Record<DassScale, number>> = {};
  for (const scale of DASS_SCALES) {
    const sum = sumWithin(sent[scale], DASS_SUM_MAX);
    if (sum === null) {
      return {
        ok: false,
        error: scoreOutOfRange(SCALE_WORDS[scale], DASS_SUM_MAX),
      };
    }
    sums[scale] = sum;
  }
  const { depression = 0, anxiety = 0, stress = 0 } = sums;
  const selfHarm = sent.selfHarm === true;
  return {
    ok: true,
    value: { instrument: "dass21", depression, anxiety, stress, selfHarm },
  };
}

function checkSrq(sent: SentScores): Parsed<ScreeningScores> {
  const srqYes = sumWithin(sent.srqYes, SRQ_MAX);
  if (srqYes === null) {
    return { ok: false, error: scoreOutOfRange(SRQ_FIELD, SRQ_MAX) };
  }
  const selfHarm = sent.selfHarm === true;
  return { ok: true, value: { instrument: "srq20", srqYes, selfHarm } };
}

/**
 * The scores of the chosen instrument: each DASS-21 sum 0–21, or the
 * SRQ-20 number of "ya" 0–20. The sums of the other instrument are left
 * out.
 */
export function checkScores(sent: SentScores): Parsed<ScreeningScores> {
  if (!isInstrument(sent.instrument)) {
    return { ok: false, error: UNKNOWN_INSTRUMENT };
  }
  return sent.instrument === "dass21" ? checkDass(sent) : checkSrq(sent);
}

function checkDate(sent: unknown, today: string): Parsed<string> {
  if (typeof sent !== "string" || !isDay(sent)) {
    return { ok: false, error: DATE_MISSING };
  }
  if (sent > today) return { ok: false, error: FUTURE_DATE };
  return { ok: true, value: sent };
}

/**
 * Checks a sent screening: a student is picked, the date is a real day
 * not after today, the scores fit their instrument, and the note fits.
 * What was sent is not trusted.
 */
export function checkScreening(
  sent: SentScreening,
  today: string,
): Parsed<CheckedScreening> {
  if (!isUuid(sent.studentId)) return { ok: false, error: PICK_STUDENT };
  const day = checkDate(sent.screenedOn, today);
  if (!day.ok) return day;
  const scores = checkScores(sent);
  if (!scores.ok) return scores;
  const note = typeof sent.note === "string" ? sent.note.trim() : "";
  if (note.length > SCREENING_NOTE_MAX) {
    return { ok: false, error: NOTE_TOO_LONG };
  }
  return {
    ok: true,
    value: {
      studentId: sent.studentId.toLowerCase(),
      screenedOn: day.value,
      scores: scores.value,
      note,
    },
  };
}
