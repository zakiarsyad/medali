import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { periodTitle } from "@/academic-periods/period-labels";

/*
 * What a Pengasuh still has to fill in this semester. Read by the screen
 * parts, so nothing here may take from the database code.
 */

/** The meetings filled in and the anak asuh scored in the running period. */
export interface MentoringProgress {
  period: Pick<AcademicPeriod, "startYear" | "term">;
  /** The meetings filled in, of the group with the fewest. */
  filled: number;
  /** How many meetings a period has, as Pengasuhan decides it. */
  meetings: number;
  /** The Aktif anak asuh with a mentoring score of the period. */
  scored: number;
  /** The Aktif anak asuh. */
  students: number;
}

/**
 * The meetings filled in of the group with the fewest, as the prototype
 * counts them for a Pengasuh of several groups. A group without a count
 * has none filled in.
 */
export function fewestFilled(
  groupIds: readonly string[],
  filledByGroup: ReadonlyMap<string, number>,
): number {
  let fewest: number | null = null;
  for (const id of groupIds) {
    const filled = filledByGroup.get(id) ?? 0;
    if (fewest === null || filled < fewest) fewest = filled;
  }
  return fewest ?? 0;
}

/** Whether every meeting is filled in and every anak asuh scored. */
export function progressComplete(progress: MentoringProgress): boolean {
  const allFilled = progress.filled >= progress.meetings;
  const allScored = progress.scored >= progress.students;
  return allFilled && allScored;
}

function shown(amount: number): string {
  return amount.toLocaleString("id-ID");
}

/** The line of the box, before its two links. */
export function progressLine(progress: MentoringProgress): string {
  const { filled, meetings, scored, students } = progress;
  return `Semester ${periodTitle(progress.period)}: ${shown(filled)} dari ${shown(meetings)} pertemuan pengasuhan sudah diisi daftar hadirnya, dan ${shown(scored)} dari ${shown(students)} anak asuh sudah Anda nilai.`;
}

/** What the box says while no academic period runs. */
export const NO_RUNNING_PERIOD =
  "Belum ada periode akademik yang berjalan, sehingga daftar hadir dan nilai pengasuhan belum dapat diisi. Periode akademik diatur oleh Kepala Unit di Pengaturan.";
