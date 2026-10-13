import { isScore } from "@/mentoring/score-range";

/** One line of "Panduan penilaian": the scores it holds and what they say. */
export interface ScoreBand {
  from: number;
  to: number;
  sentence: string;
}

/**
 * "Panduan penilaian", the highest band first. The prototype's values, to
 * be confirmed by the campus before launch.
 */
export const SCORE_BANDS: readonly ScoreBand[] = [
  {
    from: 85,
    to: 100,
    sentence: "Sangat aktif, menjadi teladan dan menggerakkan kelompok",
  },
  { from: 75, to: 84, sentence: "Aktif dan konsisten mengikuti pengasuhan" },
  { from: 65, to: 74, sentence: "Cukup aktif, perlu dorongan" },
  { from: 0, to: 64, sentence: "Kurang aktif, perlu pendampingan khusus" },
];

/** The band a score falls in, or null for what is no score. */
export function bandOf(score: number): ScoreBand | null {
  if (!isScore(score)) return null;
  return (
    SCORE_BANDS.find((band) => score >= band.from && score <= band.to) ?? null
  );
}

/** The scores of a band as the rubric writes them, such as 85–100. */
export function bandRange(band: ScoreBand): string {
  return `${band.from}–${band.to}`;
}
