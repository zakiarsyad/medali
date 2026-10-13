import type { AttendanceStatus } from "./attendance-status";
import { type UploadRange, uploadDeadline } from "./upload-range";

/** What the score reads of one schedule that is meant for a student. */
export interface ScoredSchedule extends UploadRange {
  isRequired: boolean;
  /** Where the student's attendance stands, or null with nothing sent. */
  attendance: AttendanceStatus | null;
}

export interface AttendanceScore {
  /** The required schedules the student attended: those with a valid photo. */
  attended: number;
  /** The required schedules the score is counted over. */
  counted: number;
}

/**
 * Nilai kehadiran kegiatan of a student over the schedules meant for
 * them, on a day on campus. Only a required schedule counts. A valid
 * attendance counts at once. Anything else counts as not attended, but
 * only when the upload time has closed: until then the student may still
 * send a photo. A dispensation is left out on both sides.
 */
export function attendanceScore(
  schedules: readonly ScoredSchedule[],
  today: string,
): AttendanceScore {
  let attended = 0;
  let counted = 0;
  for (const schedule of schedules) {
    if (!schedule.isRequired) continue;
    if (schedule.attendance === "dispensation") continue;
    const isValid = schedule.attendance === "valid";
    const isClosed = today > uploadDeadline(schedule);
    if (!isValid && !isClosed) continue;
    counted += 1;
    if (isValid) attended += 1;
  }
  return { attended, counted };
}

/** The score as a percentage with one decimal, or null with nothing counted. */
export function scorePercent(score: AttendanceScore): number | null {
  if (score.counted === 0) return null;
  return Math.round((score.attended / score.counted) * 1000) / 10;
}

const ONE_DECIMAL = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** A percentage with one decimal as its number shows it, such as 87,5%. */
export function shownPercent(percent: number | null): string {
  if (percent === null) return "-";
  return `${ONE_DECIMAL.format(percent)}%`;
}

/** The score as its number shows it. */
export function shownScore(score: AttendanceScore): string {
  return shownPercent(scorePercent(score));
}

/** The line under the number: how many of how many. */
export function scoreNote(score: AttendanceScore): string {
  if (score.counted === 0) return "belum ada kegiatan wajib";
  return `${score.attended}/${score.counted} kegiatan karakter`;
}
