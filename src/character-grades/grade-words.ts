import { CHARACTER_SCORE_CAP } from "@/discipline-penalties/score-limit";
import type { CharacterGrade } from "./character-grade";
import type { GradePart } from "./scheme-ids";

/** Each part as its weight field names it, in the prototype's words. */
export const PART_LABELS: Record<GradePart, string> = {
  attendance: "Kehadiran kegiatan",
  mentoring: "Nilai pengasuhan",
  siku: "Nilai sikap dan perilaku (SIKU)",
  skpm: "Nilai Sistem Kredit Prestasi Mahasiswa",
};

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

/** The mark of a student whose grade a Ringan or Sedang penalty holds at 70. */
export const LIMITED_WORDS = `Dibatasi ${CHARACTER_SCORE_CAP}`;

/** What a grade the limit lowered says: from what Nilai akhir it was held. */
export function limitedLine(limitedFrom: number): string {
  return `${LIMITED_WORDS} dari ${shownOneDecimal(limitedFrom)} karena hukuman disiplin.`;
}
