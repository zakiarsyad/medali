import type { CharacterGrade } from "./character-grade";

/** What a row shows in place of Nilai akhir and Huruf while a part is missing. */
export const INCOMPLETE_WORDS = "Belum lengkap";

const ONE_DECIMAL = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** A score with one decimal, such as 77,0, or "-" for none. */
export function shownOneDecimal(score: number | null): string {
  if (score === null) return "-";
  return ONE_DECIMAL.format(score);
}

/** A part as it is recorded: whole, or with one decimal, or "-" when missing. */
export function shownPart(score: number | null): string {
  if (score === null) return "-";
  if (Number.isInteger(score)) return score.toLocaleString("id-ID");
  return ONE_DECIMAL.format(score);
}

/** Nilai akhir of a grade, or "Belum lengkap". */
export function shownFinal(grade: CharacterGrade): string {
  if (!grade.complete) return INCOMPLETE_WORDS;
  return ONE_DECIMAL.format(grade.final);
}

/** Whether the pass letter is reached, as a reader of the letter hears it. */
export function passWords(passes: boolean): string {
  return passes ? "Lulus" : "Belum lulus";
}
