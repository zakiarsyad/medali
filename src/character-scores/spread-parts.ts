import { PREDICATES, type Predicate } from "./assessment-score";
import { PREDICATE_WORDS } from "./predicate-words";

/** One part of a bar of the predikat spread, in hundredths of its length. */
export interface SpreadPart {
  predicate: Predicate;
  start: number;
  length: number;
}

/**
 * The parts of a bar that shows how many students have each predikat, in
 * the order of the Skala predikat MEDALI. A predikat nobody has takes no
 * part.
 */
export function spreadParts(spread: Record<Predicate, number>): SpreadPart[] {
  let all = 0;
  for (const predicate of PREDICATES) all += spread[predicate];
  if (all === 0) return [];
  const parts: SpreadPart[] = [];
  let start = 0;
  for (const predicate of PREDICATES) {
    if (spread[predicate] === 0) continue;
    const length = (spread[predicate] / all) * 100;
    parts.push({ predicate, start, length });
    start += length;
  }
  return parts;
}

/** The spread in words, such as "Emas 3, Perak 5, Perunggu 0, Perlu pembinaan 1". */
export function spreadWords(spread: Record<Predicate, number>): string {
  return PREDICATES.map(
    (predicate) => `${PREDICATE_WORDS[predicate]} ${spread[predicate]}`,
  ).join(", ");
}
