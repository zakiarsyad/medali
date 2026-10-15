/*
 * How a grade scheme as typed is checked. Read by the form in the browser,
 * which shows each fault as it is typed, and by the server, which checks
 * again what is sent, so nothing here may take from the database code.
 */

import type { Parsed } from "@/parsed";
import { weightTotal } from "./grade-letter";
import {
  GRADE_LETTERS,
  type GradeLetter,
  type GradePart,
  type GradeScheme,
  type LimitedLetter,
  SCHEME_NUMBER_MAX,
  WEIGHT_TOTAL,
} from "./scheme-ids";

/** A grade scheme as typed or sent: every field still a text. */
export interface SentScheme {
  weights: Record<GradePart, string>;
  lowerLimits: Record<LimitedLetter, string>;
  passLetter: string;
}

/** What is wrong with each part of a sent scheme, or null where nothing is. */
export interface SchemeFaults {
  weights: Record<GradePart, string | null>;
  lowerLimits: Record<LimitedLetter, string | null>;
  total: string | null;
  order: string | null;
  passLetter: string | null;
}

export const NOT_WHOLE = "Isi bilangan bulat dari 0 sampai 100.";
export const TOTAL_NOT_100 = "Total bobot harus 100%.";
export const LIMITS_NOT_DOWN = "Batas bawah huruf harus menurun dari A ke D.";
export const NO_PASS_LETTER = "Pilih batas lulus dari A sampai E.";

/** 0, or a whole number without a leading zero, of at most three digits. */
const WHOLE_NUMBER = /^(0|[1-9]\d{0,2})$/;

/** A typed weight or limit as a number, or null when it is not one from 0 to 100. */
export function wholeNumberOf(typed: string): number | null {
  const trimmed = typed.trim();
  if (!WHOLE_NUMBER.test(trimmed)) return null;
  const number = Number(trimmed);
  return number <= SCHEME_NUMBER_MAX ? number : null;
}

function isGradeLetter(typed: string): typed is GradeLetter {
  return GRADE_LETTERS.some((letter) => letter === typed);
}

function weightNumbers(
  typed: SentScheme["weights"],
): GradeScheme["weights"] | null {
  const attendance = wholeNumberOf(typed.attendance);
  const mentoring = wholeNumberOf(typed.mentoring);
  const siku = wholeNumberOf(typed.siku);
  const skpm = wholeNumberOf(typed.skpm);
  if (attendance === null || mentoring === null) return null;
  if (siku === null || skpm === null) return null;
  return { attendance, mentoring, siku, skpm };
}

function limitNumbers(
  typed: SentScheme["lowerLimits"],
): GradeScheme["lowerLimits"] | null {
  const A = wholeNumberOf(typed.A);
  const B = wholeNumberOf(typed.B);
  const C = wholeNumberOf(typed.C);
  const D = wholeNumberOf(typed.D);
  if (A === null || B === null || C === null || D === null) return null;
  return { A, B, C, D };
}

function fieldFault(typed: string): string | null {
  return wholeNumberOf(typed) === null ? NOT_WHOLE : null;
}

function limitsGoDown(limits: Record<LimitedLetter, number>): boolean {
  return limits.A > limits.B && limits.B > limits.C && limits.C > limits.D;
}

/**
 * Each fault of a sent scheme. The total is checked only once every
 * weight is a number, and the order only once every limit is: until
 * then the field itself says what is wrong.
 */
export function schemeFaults(sent: SentScheme): SchemeFaults {
  const weights = weightNumbers(sent.weights);
  const limits = limitNumbers(sent.lowerLimits);
  const isTotalWrong =
    weights !== null && weightTotal(weights) !== WEIGHT_TOTAL;
  const isOrderWrong = limits !== null && !limitsGoDown(limits);
  const typedWeights = sent.weights;
  const typedLimits = sent.lowerLimits;
  return {
    weights: {
      attendance: fieldFault(typedWeights.attendance),
      mentoring: fieldFault(typedWeights.mentoring),
      siku: fieldFault(typedWeights.siku),
      skpm: fieldFault(typedWeights.skpm),
    },
    lowerLimits: {
      A: fieldFault(typedLimits.A),
      B: fieldFault(typedLimits.B),
      C: fieldFault(typedLimits.C),
      D: fieldFault(typedLimits.D),
    },
    total: isTotalWrong ? TOTAL_NOT_100 : null,
    order: isOrderWrong ? LIMITS_NOT_DOWN : null,
    passLetter: isGradeLetter(sent.passLetter) ? null : NO_PASS_LETTER,
  };
}

/** Checks a sent scheme: every number whole from 0 to 100, a total of 100, limits going down, and a pass letter. */
export function parseScheme(sent: SentScheme): Parsed<GradeScheme> {
  const weights = weightNumbers(sent.weights);
  const lowerLimits = limitNumbers(sent.lowerLimits);
  if (weights === null || lowerLimits === null) {
    return { ok: false, error: NOT_WHOLE };
  }
  if (weightTotal(weights) !== WEIGHT_TOTAL) {
    return { ok: false, error: TOTAL_NOT_100 };
  }
  if (!limitsGoDown(lowerLimits)) return { ok: false, error: LIMITS_NOT_DOWN };
  const { passLetter } = sent;
  if (!isGradeLetter(passLetter)) return { ok: false, error: NO_PASS_LETTER };
  return { ok: true, value: { weights, lowerLimits, passLetter } };
}

/** Whether "Simpan skema" may be pressed: only for a scheme the server would take. */
export function maySave(typed: SentScheme): boolean {
  return parseScheme(typed).ok;
}
