import { coversActivity } from "./leave-cover";
import type { LeaveKind } from "./leave-ids";

/*
 * How approved leave changes the attendance at a dorm activity. Read by
 * the screen parts in the browser, so nothing here may take from the
 * database code.
 */

/**
 * What approved leave makes of a resident at an activity it covers:
 * Izin for Izin pesiar and Izin khusus, which counts neither as Hadir nor
 * as Tidak hadir, and Hadir with the note ITMK for ITMK.
 */
export type LeaveMark = "leave" | "itmk";

/** The leave marks of the participants of an activity, by student. */
export type LeaveMarks = Record<string, LeaveMark>;

/** An approved leave of a student. */
export interface ApprovedLeave {
  studentId: string;
  kind: LeaveKind;
  start: Date;
  end: Date;
}

/** An activity on a day, with the hours it starts and ends. */
export interface HeldTimes {
  day: string;
  startTime: string;
  endTime: string;
}

export const ITMK_NOTE = "ITMK";

/**
 * The mark approved leave gives a student at an activity: that of a leave
 * of theirs whose time overlaps the activity's, or null when none does.
 * Two approved leaves of a student never overlap each other.
 */
export function leaveMarkOf(
  leaves: ApprovedLeave[],
  studentId: string,
  held: HeldTimes,
): LeaveMark | null {
  const covering = leaves.find(
    (leave) => leave.studentId === studentId && coversActivity(leave, held),
  );
  if (!covering) return null;
  return covering.kind === "skip_activities" ? "itmk" : "leave";
}

/** The leave marks of these students at an activity. */
export function leaveMarksAt(
  leaves: ApprovedLeave[],
  studentIds: string[],
  held: HeldTimes,
): LeaveMarks {
  const marks: LeaveMarks = {};
  for (const studentId of studentIds) {
    const mark = leaveMarkOf(leaves, studentId, held);
    if (mark !== null) marks[studentId] = mark;
  }
  return marks;
}

/** The note of a Hadir that ITMK gave: ITMK, then the note BAM wrote. */
export function itmkNote(note: string): string {
  return note === "" ? ITMK_NOTE : `${ITMK_NOTE} · ${note}`;
}
