import { LIMITED_WORDS } from "@/character-grades/grade-words";
import {
  GRADE_LETTERS,
  type GradeLetter,
  type GradePart,
} from "@/character-grades/scheme-ids";
import { CHARACTER_SCORE_CAP } from "@/discipline-penalties/score-limit";
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

/** Each part as "Komponen nilai karakter" names it, in the prototype's words. */
const PART_WORDS: Record<GradePart, string> = {
  attendance: "Kehadiran kegiatan",
  mentoring: "Pengasuhan",
  siku: "Sikap dan perilaku (SIKU)",
  skpm: "SKPM",
};

/** A part with its weight in brackets, such as "Pengasuhan (25%)". */
export function partLabel(
  part: GradePart,
  weights: Record<GradePart, number>,
): string {
  return `${PART_WORDS[part]} (${weights[part]}%)`;
}

/** The line under the parts: where Kehadiran comes from, and how many are held at 70. */
export function componentsNote(recap: ShownGrades): string {
  return `Kehadiran dihitung otomatis dari presensi kegiatan karakter. ${shown(recap.limited)} mahasiswa nilainya dibatasi ${CHARACTER_SCORE_CAP} karena hukuman disiplin.`;
}

/** The line under "Sebaran huruf": how many are "Belum lengkap" and left out. */
export function incompleteLine(recap: ShownGrades): string {
  return `${shown(recap.incomplete)} belum lengkap, tidak dihitung.`;
}

/** The line beside "Sebaran huruf": how many have a worked-out grade. */
export function gradedLine(recap: ShownGrades): string {
  return `${shown(recap.graded)} mahasiswa`;
}
