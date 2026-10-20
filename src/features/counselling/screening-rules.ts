import {
  type Instrument,
  SCREENING_LEVELS,
  type ScreeningLevel,
} from "./screening-ids";
import { ADVICE_WORDS, CRISIS_ADVICE } from "./screening-words";

/*
 * How the level and the advice of a screening are worked out. The limits
 * are the prototype's, to be confirmed by the campus before launch. Read
 * by the form in the browser and by the server, so nothing here may take
 * from the database code.
 */

/** The three scales of DASS-21, in the order they show. */
export const DASS_SCALES = ["depression", "anxiety", "stress"] as const;

export type DassScale = (typeof DASS_SCALES)[number];

/** The doubled sums from which Ringan, Sedang, Berat and Sangat berat start. */
export const DASS_LIMITS: Record<DassScale, readonly number[]> = {
  depression: [10, 14, 21, 28],
  anxiety: [8, 10, 15, 20],
  stress: [15, 19, 26, 34],
};

/** The number of "ya" of SRQ-20 from which a student needs counselling. */
export const SRQ_LIMIT = 6;

/** The levels of "Perlu konseling": Sedang and above. */
export const COUNSELLING_LEVELS: readonly ScreeningLevel[] =
  SCREENING_LEVELS.slice(SCREENING_LEVELS.indexOf("moderate"));

/** The scores of one screening, as checked. */
export type ScreeningScores =
  | {
      instrument: "dass21";
      depression: number;
      anxiety: number;
      stress: number;
      selfHarm: boolean;
    }
  | { instrument: "srq20"; srqYes: number; selfHarm: boolean };

/** One DASS-21 scale: its doubled sum and the level it gives. */
export interface ScalePart {
  scale: DassScale;
  score: number;
  level: ScreeningLevel;
}

export interface ScreeningResult {
  level: ScreeningLevel;
  /** The DASS-21 scales; none for SRQ-20. */
  scales: ScalePart[];
  advice: string;
  /** Self-harm was ticked: the mark "Risiko". */
  risk: boolean;
}

/** The level a score gives: one step up for each limit it reaches. */
export function levelOfScore(
  score: number,
  limits: readonly number[],
): ScreeningLevel {
  const reached = limits.filter((limit) => score >= limit).length;
  return SCREENING_LEVELS[reached] ?? "extremely_severe";
}

function worst(levels: ScreeningLevel[]): ScreeningLevel {
  let place = 0;
  for (const level of levels) {
    place = Math.max(place, SCREENING_LEVELS.indexOf(level));
  }
  return SCREENING_LEVELS[place] ?? "normal";
}

function scaleParts(scores: ScreeningScores): ScalePart[] {
  if (scores.instrument === "srq20") return [];
  return DASS_SCALES.map((scale) => {
    const score = scores[scale] * 2;
    return { scale, score, level: levelOfScore(score, DASS_LIMITS[scale]) };
  });
}

function levelOfScores(scores: ScreeningScores, scales: ScalePart[]) {
  if (scores.instrument === "srq20") {
    return scores.srqYes >= SRQ_LIMIT ? "moderate" : "normal";
  }
  return worst(scales.map((part) => part.level));
}

/**
 * The level and "Rekomendasi" of a screening. DASS-21: each sum doubled,
 * compared with its scale's limits, and the worst of the three. SRQ-20:
 * Sedang from 6 "ya", Normal below. A self-harm tick makes it Sangat
 * berat with the crisis advice, whatever the scores.
 */
export function screeningResult(scores: ScreeningScores): ScreeningResult {
  const scales = scaleParts(scores);
  if (scores.selfHarm) {
    return {
      level: "extremely_severe",
      scales,
      advice: CRISIS_ADVICE,
      risk: true,
    };
  }
  const level = levelOfScores(scores, scales);
  return { level, scales, advice: ADVICE_WORDS[level], risk: false };
}

/** A screening as it is kept: the sums of the other instrument are none. */
export interface KeptScores {
  instrument: Instrument;
  depression: number | null;
  anxiety: number | null;
  stress: number | null;
  srqYes: number | null;
  selfHarm: boolean;
}

/** The scores of a kept screening, or null when one it needs is missing. */
export function scoresOf(kept: KeptScores): ScreeningScores | null {
  const { depression, anxiety, stress, srqYes, selfHarm } = kept;
  if (kept.instrument === "srq20") {
    if (srqYes === null) return null;
    return { instrument: "srq20", srqYes, selfHarm };
  }
  if (depression === null || anxiety === null || stress === null) return null;
  return { instrument: "dass21", depression, anxiety, stress, selfHarm };
}

/** The fewest screened students the campus count shows as a number. */
export const SMALLEST_SHOWN_COUNT = 5;

/**
 * The campus count as other staff see it: a count of 1 to 4 shows as
 * "<5", so it cannot point to a person.
 */
export function shownCount(count: number): string {
  if (count > 0 && count < SMALLEST_SHOWN_COUNT) {
    return `<${SMALLEST_SHOWN_COUNT}`;
  }
  return count.toLocaleString("id-ID");
}
