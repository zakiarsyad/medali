import { LIMITED_WORDS } from "@/character-grades/grade-words";
import { GRADE_LETTERS, type GradeLetter } from "@/character-grades/scheme-ids";
import type { ShownGrades } from "./grade-recap";

/** What the card and section 2 say while nobody has a worked-out grade. */
export const NO_GRADES = "Belum ada nilai karakter untuk mahasiswa ini.";

function shown(amount: number): string {
  return amount.toLocaleString("id-ID");
}

/** The line of the card "Nilai karakter". */
export function gradeCardLine(
  recap: ShownGrades,
  passLetter: GradeLetter,
): string {
  return `${recap.passing}% memenuhi minimal ${passLetter}. ${shown(recap.limited)} ${LIMITED_WORDS.toLowerCase()}.`;
}

/** One part of the bar of the card, in hundredths of its length. */
export interface LetterPart {
  letter: GradeLetter;
  start: number;
  length: number;
}

/** The parts of the bar of the card: each letter as its share of the worked-out grades. */
export function letterParts(
  letters: Record<GradeLetter, number>,
  graded: number,
): LetterPart[] {
  const parts: LetterPart[] = [];
  let start = 0;
  for (const letter of GRADE_LETTERS) {
    if (letters[letter] === 0) continue;
    const length = (letters[letter] * 100) / graded;
    parts.push({ letter, start, length });
    start += length;
  }
  return parts;
}
