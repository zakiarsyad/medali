import type { DormId } from "@/dorms/dorms";
import type { AcceptedAs } from "./clarification-ids";
import {
  type ApprovedLeave,
  type HeldTimes,
  type LeaveMark,
  leaveMarkOf,
} from "./leave-marks";

/*
 * How Dashboard asrama adds up announced counts: Hadir, Tidak hadir and
 * Izin, by count, by penanggung jawab and by dorm, with approved leave
 * and accepted clarifications applied as Kegiatan asrama applies them.
 * The database adds up the marks as kept, in groups; only the few
 * participants that leave or a clarification changes are read one by one.
 */

/** How many participants of a count kept one mark, among those of one dorm today. */
export interface MarkGroup {
  countId: string;
  /** The dorm they live in today; null for one who no longer lives in one. */
  dorm: DormId | null;
  isAbsent: boolean;
  students: number;
}

/** What approved leave or an accepted clarification makes of a participant. */
export type Change = "present" | "leave";

/** A participant whose mark leave or a clarification changes. */
export interface Changed {
  countId: string;
  dorm: DormId | null;
  /** What the count keeps for them. */
  isAbsent: boolean;
  becomes: Change;
}

/** Hadir, Tidak hadir and Izin, which counts as neither. */
export interface Attendance {
  present: number;
  absent: number;
  leave: number;
}

/**
 * The change of a participant: leave that covers the activity decides
 * first, Izin for Izin pesiar and Izin khusus and Hadir for ITMK; where
 * none does, an accepted clarification makes them Hadir or Izin.
 */
export function changeOf(
  leaveMark: LeaveMark | null,
  acceptedAs: AcceptedAs | null,
): Change | null {
  if (leaveMark === "itmk") return "present";
  if (leaveMark === "leave") return "leave";
  return acceptedAs;
}

/** Where a group or a changed participant belongs. */
export interface Place {
  countId: string;
  dorm: DormId | null;
}

/**
 * Hadir, Tidak hadir and Izin of the groups `keeps` takes, with the
 * changes of those groups applied: a changed participant leaves the mark
 * the count keeps and is counted as what they become.
 */
export function tallyWhere(
  groups: MarkGroup[],
  changed: Changed[],
  keeps: (place: Place) => boolean,
): Attendance {
  const tally: Attendance = { present: 0, absent: 0, leave: 0 };
  for (const group of groups) {
    if (!keeps(group)) continue;
    if (group.isAbsent) tally.absent += group.students;
    else tally.present += group.students;
  }
  for (const each of changed) {
    if (!keeps(each)) continue;
    if (each.isAbsent) tally.absent -= 1;
    else tally.present -= 1;
    if (each.becomes === "present") tally.present += 1;
    else tally.leave += 1;
  }
  return tally;
}

/** A participant's mark as the count keeps it, with the dorm they live in today. */
export interface ParticipantMark {
  countId: string;
  studentId: string;
  dorm: DormId | null;
  isAbsent: boolean;
}

/** The key of a participant of a count. */
export function markKey(countId: string, studentId: string): string {
  return `${countId} ${studentId}`;
}

/**
 * The participants among `marks` whose mark approved leave or an
 * accepted clarification changes. `held` gives the time of each count's
 * activity on its day, which the leave must overlap; `accepted` what each
 * accepted clarification made of a participant, by `markKey`.
 */
export function changesOf(
  marks: ParticipantMark[],
  held: ReadonlyMap<string, HeldTimes>,
  leaves: ApprovedLeave[],
  accepted: ReadonlyMap<string, AcceptedAs>,
): Changed[] {
  const changed: Changed[] = [];
  for (const { countId, studentId, dorm, isAbsent } of marks) {
    const times = held.get(countId);
    if (times === undefined) continue;
    const leaveMark = leaveMarkOf(leaves, studentId, times);
    const acceptedAs = accepted.get(markKey(countId, studentId)) ?? null;
    const becomes = changeOf(leaveMark, acceptedAs);
    if (becomes !== null) changed.push({ countId, dorm, isAbsent, becomes });
  }
  return changed;
}

/** Peserta of an announced count: everyone in it, whatever their mark. */
export function participantsOf(attendance: Attendance): number {
  return attendance.present + attendance.absent + attendance.leave;
}
