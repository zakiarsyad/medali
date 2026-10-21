/*
 * How Penilaian jasmani writes its facts. Read by the screen parts in the
 * browser, so nothing here may take from the database code.
 */

import { CATEGORY_WORDS } from "@/health-notes/category-words";
import type { LimitKey } from "@/health-notes/fitness-ids";
import { DAY } from "@/ui/day";
import type { FitnessFilter } from "./fitness-address";

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

function shown(amount: number): string {
  return amount.toLocaleString("id-ID");
}

/** The line under the bars of "Kategori". */
export function untestedLine(untested: number): string {
  if (untested === 0) return "Semua mahasiswa sudah mengikuti tes kebugaran.";
  return `${shown(untested)} mahasiswa belum mengikuti tes kebugaran.`;
}

/** What "Simpan skor" says once the scores are kept. */
export function savedScoresMessage(saved: number): string {
  return `${shown(saved)} skor tes kebugaran disimpan.`;
}

/** The line beside "Simpan skor" while scores are typed. */
export function readyLine(filled: number): string {
  if (filled === 0) return "Isi skor yang tersedia; kolom kosong dilewati.";
  return `${shown(filled)} skor siap disimpan.`;
}

/** "Rerata skor" with one decimal, such as 75,3, or "-" for none. */
export function shownMean(mean: number | null): string {
  if (mean === null) return "-";
  return mean.toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
