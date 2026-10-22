import { averageWords } from "./achievement-words";
import type { MenteeFacts } from "./mentee-attention";

/*
 * The numbers under "Catatan pengasuhan terbaru" of Dashboard anak asuh.
 * Read by the screen parts, so nothing here may take from the database
 * code.
 */

/** How many notes the panel shows, as in the prototype. */
export const MENTEE_NOTES_SHOWN = 5;

/** The four numbers under the notes. */
export interface MenteeNoteNumbers {
  /** "Catatan 30 hari": the notes about the anak asuh of the last 30 days. */
  recentNotes: number;
  /** "Perlu pembinaan": the anak asuh on the coaching list not yet Selesai. */
  openCoaching: number;
  /** "Pelanggaran disiplin": the discipline penalties of the anak asuh. */
  penalties: number;
  /** "Rerata kehadiran kegiatan", or null while no anak asuh has one. */
  attendance: number | null;
}

/** The anak asuh on the coaching list not yet Selesai, as Pembinaan counts them. */
export function openCoachingOf(facts: readonly MenteeFacts[]): number {
  return facts.filter((each) => each.coaching !== null).length;
}

/** The average Nilai kehadiran of the anak asuh who have one, or null for none. */
export function attendanceAverageOf(
  facts: readonly MenteeFacts[],
): number | null {
  let counted = 0;
  let sum = 0;
  for (const { attendance } of facts) {
    if (attendance === null) continue;
    counted += 1;
    sum += attendance;
  }
  return counted === 0 ? null : sum / counted;
}

/** "Rerata kehadiran kegiatan" as shown: one decimal, or "-" for none. */
export function attendanceWords(average: number | null): string {
  if (average === null) return "-";
  return averageWords(average);
}
