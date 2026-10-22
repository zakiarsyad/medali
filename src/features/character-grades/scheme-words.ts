/*
 * How "Skema bobot" writes the scheme. Read by the screen parts in the
 * browser, so nothing here may take from the database code.
 */

import { weightTotal } from "@/character-grades/grade-letter";
import {
  GRADE_PARTS,
  type GradePart,
  type GradeScheme,
  WEIGHT_TOTAL,
} from "@/character-grades/scheme-ids";
import { DAY } from "@/ui/day";
import { wholeNumberOf } from "./scheme-input";

/** Each part as its weight field names it, in the prototype's words. */
export const PART_LABELS: Record<GradePart, string> = {
  attendance: "Kehadiran kegiatan",
  mentoring: "Nilai pengasuhan",
  siku: "Nilai sikap dan perilaku (SIKU)",
  skpm: "Nilai Sistem Kredit Prestasi Mahasiswa",
};

/** Each part as the sentence "Nilai akhir = …" names it. */
const PART_IN_SENTENCE: Record<GradePart, string> = {
  attendance: "kehadiran kegiatan",
  mentoring: "pengasuhan",
  siku: "sikap dan perilaku (SIKU)",
  skpm: "SKPM",
};

/** The line a role that only reads the panel sees instead of "Simpan skema". */
export const READ_ONLY_NOTE =
  "Skema bobot ditetapkan oleh Kepala Unit Pembangunan Karakter.";

/** The confirm "Simpan skema" asks before it saves. */
export const SAVE_QUESTION =
  "Simpan skema bobot? Nilai akhir semua mahasiswa akan dihitung ulang dengan skema ini.";

/** The weights as typed, with a weight that is not a number as 0, as the prototype counts it. */
export function shownWeights(
  typed: Record<GradePart, string>,
): GradeScheme["weights"] {
  return {
    attendance: wholeNumberOf(typed.attendance) ?? 0,
    mentoring: wholeNumberOf(typed.mentoring) ?? 0,
    siku: wholeNumberOf(typed.siku) ?? 0,
    skpm: wholeNumberOf(typed.skpm) ?? 0,
  };
}

/** "Nilai akhir = 25% × kehadiran kegiatan + …", with the weights filled in. */
export function formulaSentence(weights: GradeScheme["weights"]): string {
  const terms = GRADE_PARTS.map(
    (part) => `${weights[part]}% × ${PART_IN_SENTENCE[part]}`,
  );
  return `Nilai akhir = ${terms.join(" + ")}.`;
}

/** Who set the scheme last and when, or that it is the starting one. */
export function schemeNote(set: { at: Date; by: string } | null): string {
  if (set === null) return "Bobot awal belum disesuaikan dengan KEP-220.";
  return `Ditetapkan ${DAY.format(set.at)} oleh ${set.by}.`;
}

/** A cell of the bar: one percent of a part, or of what is not given yet. */
export type BarCell = GradePart | "rest";

/**
 * The bar of shares, one cell per percent. A total below 100 leaves the
 * rest of the bar empty; a total above 100 makes the bar longer, so each
 * part still shows its share of the whole.
 */
export function barCells(weights: GradeScheme["weights"]): BarCell[] {
  const cells: BarCell[] = [];
  for (const part of GRADE_PARTS) {
    for (let percent = 0; percent < weights[part]; percent += 1) {
      cells.push(part);
    }
  }
  const rest = WEIGHT_TOTAL - weightTotal(weights);
  for (let percent = 0; percent < rest; percent += 1) {
    cells.push("rest");
  }
  return cells;
}
