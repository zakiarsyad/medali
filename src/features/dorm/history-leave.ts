import type { CampusMoment } from "@/academic-periods/campus-clock";
import { activityState } from "./activity-state";
import {
  type HistoryEntry,
  heldKey,
  type Tally,
  type TimedMark,
} from "./history";
import {
  type ApprovedLeave,
  itmkNote,
  type LeaveMark,
  leaveMarkOf,
} from "./leave-marks";

/*
 * How approved leave changes a resident's own attendance. Read by the
 * screen parts in the browser, so nothing here may take from the
 * database code.
 */

/** An own mark in an announced count that approved leave covers. */
export interface CoveredOwnMark {
  isAbsent: boolean;
  mark: LeaveMark;
}

/** The covered marks, by the key of their activity on its day. */
export type CoveredOwnMarks = Map<string, CoveredOwnMark>;

/**
 * Those of the student's own marks whose activity is over at a moment
 * and whose time an approved leave of theirs covers.
 */
export function coveredOwnMarks(
  marks: TimedMark[],
  leaves: ApprovedLeave[],
  studentId: string,
  now: CampusMoment,
): CoveredOwnMarks {
  const covered: CoveredOwnMarks = new Map();
  for (const mark of marks) {
    if (activityState(mark, now) !== "over") continue;
    const leaveMark = leaveMarkOf(leaves, studentId, mark);
    if (leaveMark === null) continue;
    covered.set(heldKey(mark), { isAbsent: mark.isAbsent, mark: leaveMark });
  }
  return covered;
}

/**
 * Hadir and Tidak hadir as approved leave makes them: Izin counts as
 * neither, so it is left out of the percentage, and ITMK counts as Hadir.
 */
export function tallyWithLeave(tally: Tally, covered: CoveredOwnMarks): Tally {
  let { present, absent } = tally;
  for (const { isAbsent, mark } of covered.values()) {
    if (isAbsent) absent -= 1;
    else present -= 1;
    if (mark === "itmk") present += 1;
  }
  return { present, absent };
}

/**
 * Riwayat as approved leave makes it: an announced activity it covers is
 * Izin, or Hadir with the note ITMK. One not announced stays so.
 */
export function historyWithLeave(
  history: HistoryEntry[],
  covered: CoveredOwnMarks,
): HistoryEntry[] {
  return history.map((entry) => {
    const cover = covered.get(heldKey(entry));
    if (!cover || entry.status === "not_announced") return entry;
    if (cover.mark === "leave") return { ...entry, status: "leave" };
    return { ...entry, status: "present", note: itmkNote(entry.note) };
  });
}
