/*
 * How Penilaian jasmani writes its facts. Read by the screen parts in the
 * browser, so nothing here may take from the database code.
 */

import { DAY } from "@/ui/day";
import type { FitnessFilter } from "./fitness-address";
import type { ScoreRange, ShownCategory } from "./fitness-category";
import type { LimitKey } from "./fitness-ids";

/** Each category, and Belum dites, in the prototype's words. */
export const CATEGORY_WORDS: Record<ShownCategory, string> = {
  excellent: "Prima",
  good: "Baik",
  attention: "Perlu perhatian",
  medical: "Perlu tindak lanjut medis",
  untested: "Belum dites",
};

/** Each choice of the filter above "Hasil tes kebugaran". */
export const FILTER_WORDS: Record<FitnessFilter, string> = {
  all: "Semua kategori",
  ...CATEGORY_WORDS,
};

/** Each field of "Ambang skor". */
export const LIMIT_LABELS: Record<LimitKey, string> = {
  excellentFrom: "Prima mulai",
  goodFrom: "Baik mulai",
  attentionFrom: "Perlu perhatian mulai",
};

/** What a role that may not enter scores sees where the form would be. */
export const READ_ONLY_NOTE =
  "Hasil tes kebugaran diinput oleh Kepala Unit Pembangunan Karakter dan Penilai Mahasiswa.";

/** What a role that may not change "Ambang skor" sees under it. */
export const LIMITS_READ_ONLY_NOTE =
  "Ambang ditetapkan oleh Kepala Unit Pembangunan Karakter.";

const BELOW_LIMITS =
  "Di bawah ambang perlu perhatian: perlu tindak lanjut medis.";

/** The line under "Ambang skor": what is below it, and who set it or that it is the starting one. */
export function limitsNote(set: { at: Date; by: string } | null): string {
  if (set === null) {
    return `${BELOW_LIMITS} Ambang awal, sesuaikan dengan pedoman tes kebugaran.`;
  }
  return `${BELOW_LIMITS} Ditetapkan ${DAY.format(set.at)} oleh ${set.by}.`;
}

/** The scores of a category, such as 85–100. */
export function rangeWords(range: ScoreRange): string {
  return `${range.lowest}–${range.highest}`;
}

function shown(amount: number): string {
  return amount.toLocaleString("id-ID");
}

/** The line under the bars of "Kategori". */
export function untestedLine(untested: number): string {
  if (untested === 0) return "Semua mahasiswa sudah mengikuti tes kebugaran.";
  return `${shown(untested)} mahasiswa belum mengikuti tes kebugaran.`;
}

/** "Rerata skor" with one decimal, such as 75,3, or "-" for none. */
export function shownMean(mean: number | null): string {
  if (mean === null) return "-";
  return mean.toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
