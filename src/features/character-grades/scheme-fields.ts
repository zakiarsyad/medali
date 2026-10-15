/*
 * The fields of the form "Skema bobot", shared by the form in the browser
 * and the server that reads what it sends.
 */

import type { GradePart, GradeScheme, LimitedLetter } from "./scheme-ids";
import type { SentScheme } from "./scheme-input";

export const PASS_LETTER_FIELD = "passLetter";

/** The version of the scheme the form was opened on. */
export const VERSION_FIELD = "version";

export function weightField(part: GradePart): string {
  return `weight_${part}`;
}

export function limitField(letter: LimitedLetter): string {
  return `limit_${letter}`;
}

/** A scheme as its form shows it before anything is typed. */
export function typedOf(scheme: GradeScheme): SentScheme {
  const { weights, lowerLimits } = scheme;
  return {
    weights: {
      attendance: String(weights.attendance),
      mentoring: String(weights.mentoring),
      siku: String(weights.siku),
      skpm: String(weights.skpm),
    },
    lowerLimits: {
      A: String(lowerLimits.A),
      B: String(lowerLimits.B),
      C: String(lowerLimits.C),
      D: String(lowerLimits.D),
    },
    passLetter: scheme.passLetter,
  };
}

/** The scheme a form sent, each field read by `field`, as text. */
export function sentSchemeOf(field: (name: string) => string): SentScheme {
  return {
    weights: {
      attendance: field(weightField("attendance")),
      mentoring: field(weightField("mentoring")),
      siku: field(weightField("siku")),
      skpm: field(weightField("skpm")),
    },
    lowerLimits: {
      A: field(limitField("A")),
      B: field(limitField("B")),
      C: field(limitField("C")),
      D: field(limitField("D")),
    },
    passLetter: field(PASS_LETTER_FIELD),
  };
}
