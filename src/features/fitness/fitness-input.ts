/*
 * How "Ambang skor" and the scores of a group form are checked. Read by
 * the forms in the browser and by the server, which checks again what is
 * sent, so nothing here may take from the database code.
 */

import { isDay } from "@/db/is-day";
import type { Parsed } from "@/parsed";
import {
  type FitnessLimits,
  LIMIT_MAX,
  LIMIT_MIN,
  type LimitKey,
  SCORE_MAX,
  SCORE_MIN,
} from "./fitness-ids";

/** "Ambang skor" as typed or sent: every limit still a text. */
export type SentLimits = Record<LimitKey, string>;

/** One row of the group form as sent: a student and the "Skor baru" typed. */
export interface SentScore {
  studentId: string;
  typed: string;
}

/** A score the server keeps for a student. */
export interface StudentScore {
  studentId: string;
  score: number;
}

export const LIMITS_NOT_WHOLE = "Ambang harus bilangan bulat 1–100.";
export const LIMITS_NOT_DOWN =
  "Ambang harus menurun: prima > baik > perlu perhatian.";
export const SCORE_NOT_WHOLE = "Skor harus bilangan bulat 0–100.";
export const NO_SCORE = "Isi minimal satu skor.";
export const NO_TEST_DAY = "Isi tanggal tes.";
export const DAY_IN_FUTURE = "Tanggal tes tidak boleh setelah hari ini.";

/** 0, or a whole number without a leading zero, of at most three digits. */
const WHOLE_NUMBER = /^(0|[1-9]\d{0,2})$/;

function wholeWithin(typed: string, min: number, max: number): number | null {
  const trimmed = typed.trim();
  if (!WHOLE_NUMBER.test(trimmed)) return null;
  const number = Number(trimmed);
  if (number < min || number > max) return null;
  return number;
}

/** A typed score as a number, or null when it is not a whole one from 0 to 100. */
export function scoreOf(typed: string): number | null {
  return wholeWithin(typed, SCORE_MIN, SCORE_MAX);
}

/** Limits as their form shows them before anything is typed. */
export function typedLimitsOf(limits: FitnessLimits): SentLimits {
  return {
    excellentFrom: String(limits.excellentFrom),
    goodFrom: String(limits.goodFrom),
    attentionFrom: String(limits.attentionFrom),
  };
}

function limitsGoDown(limits: FitnessLimits): boolean {
  return (
    limits.excellentFrom > limits.goodFrom &&
    limits.goodFrom > limits.attentionFrom
  );
}

/** Checks a sent "Ambang skor": three whole limits from 1 to 100 that go down. */
export function parseLimits(sent: SentLimits): Parsed<FitnessLimits> {
  const excellentFrom = wholeWithin(sent.excellentFrom, LIMIT_MIN, LIMIT_MAX);
  const goodFrom = wholeWithin(sent.goodFrom, LIMIT_MIN, LIMIT_MAX);
  const attentionFrom = wholeWithin(sent.attentionFrom, LIMIT_MIN, LIMIT_MAX);
  if (excellentFrom === null || goodFrom === null || attentionFrom === null) {
    return { ok: false, error: LIMITS_NOT_WHOLE };
  }
  const limits = { excellentFrom, goodFrom, attentionFrom };
  if (!limitsGoDown(limits)) return { ok: false, error: LIMITS_NOT_DOWN };
  return { ok: true, value: limits };
}

function isFilled(row: SentScore): boolean {
  return row.typed.trim() !== "";
}

/**
 * Checks the rows of a group form: an empty "Skor baru" is skipped, and
 * every filled one must be a whole score from 0 to 100, or nothing is
 * kept. At least one must be filled.
 */
export function parseScores(
  rows: readonly SentScore[],
): Parsed<StudentScore[]> {
  const filled = rows.filter(isFilled);
  if (filled.length === 0) return { ok: false, error: NO_SCORE };
  const scores: StudentScore[] = [];
  for (const row of filled) {
    const score = scoreOf(row.typed);
    if (score === null) return { ok: false, error: SCORE_NOT_WHOLE };
    scores.push({ studentId: row.studentId, score });
  }
  return { ok: true, value: scores };
}

/** Checks a sent "Tanggal tes": a real day, not after `today`. */
export function parseTestDay(sent: string, today: string): Parsed<string> {
  if (!isDay(sent)) return { ok: false, error: NO_TEST_DAY };
  if (sent > today) return { ok: false, error: DAY_IN_FUTURE };
  return { ok: true, value: sent };
}

/** "Tahun tes": the year of the day of the test. */
export function testYearOf(day: string): number {
  return Number(day.slice(0, 4));
}

/** The first day of the year a day is in, such as 2026-01-01. */
export function yearStartOf(day: string): string {
  return `${testYearOf(day)}-01-01`;
}

/** The field of "Ambang skor" that carries the version its form was opened on. */
export const LIMITS_VERSION_FIELD = "version";

/**
 * The rows of a sent group form: each student with the "Skor baru" sent
 * beside it. Null when the two lists are not of one length, which no
 * form of the app sends.
 */
export function pairedRows(
  studentIds: readonly string[],
  typed: readonly string[],
): SentScore[] | null {
  if (studentIds.length !== typed.length) return null;
  return studentIds.map((studentId, place) => ({
    studentId,
    typed: typed[place] ?? "",
  }));
}
