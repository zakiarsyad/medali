import { type CoveredActivity, coveredWords } from "./leave-cover";
import { LEAVE_OVERLAPS } from "./leave-messages";
import { type LeaveTimes, lengthWords, timeProblems } from "./leave-rules";

/*
 * The note under the times of the leave form. Read by the screen parts
 * in the browser, so nothing here may take from the database code.
 */

/** The note, and whether it says why the times would be refused. */
export interface LeaveNote {
  words: string;
  isProblem: boolean;
}

function coveredNote(covered: CoveredActivity[]): string {
  if (covered.length === 0) {
    return "Tidak ada kegiatan asrama Anda dalam rentang ini.";
  }
  const named = covered.map(coveredWords).join(", ");
  return `Kegiatan asrama yang tidak diikuti dan akan tercatat hadir (ITMK): ${named}.`;
}

/**
 * The note for times typed at a moment: the length, for ITMK the dorm
 * activities it covers, and then whatever would refuse the times, also
 * an overlap with another request that waits or is approved. `covered`
 * is null when the activities are not looked for.
 */
export function leaveNote(
  times: LeaveTimes,
  now: Date,
  covered: CoveredActivity[] | null,
  overlaps: boolean,
): LeaveNote {
  const parts: string[] = [];
  if (times.end > times.start) parts.push(lengthWords(times.start, times.end));
  if (covered !== null) parts.push(coveredNote(covered));
  const problems = timeProblems(times, now);
  if (overlaps) problems.push(LEAVE_OVERLAPS.error);
  return {
    words: [...parts, ...problems].join(" "),
    isProblem: problems.length > 0,
  };
}
