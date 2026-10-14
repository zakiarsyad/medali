import { itmkNote, type LeaveMark } from "./leave-marks";

/*
 * What staff see of an announced count. Read by the screen parts in the
 * browser, so nothing here may take from the database code.
 */

/**
 * How a participant counts: Hadir, Tidak hadir, or Izin, which approved
 * leave gives and which counts as neither.
 */
export type PresenceStatus = "present" | "absent" | "leave";

/** A participant absent, on leave or with a note, as Rincian lists them. */
export interface MarkedParticipant {
  studentId: string;
  name: string;
  nim: string;
  status: PresenceStatus;
  note: string;
}

/**
 * The announced count of an activity on a day, of the students the
 * account may see.
 */
export interface AnnouncedAttendance {
  announcedAt: Date;
  announcedBy: string;
  present: number;
  absent: number;
  /** Those absent, on leave or with a note, by name. */
  marked: MarkedParticipant[];
}

/** The announced counts of a day, by the id of their activity. */
export type DayAttendance = Record<string, AnnouncedAttendance>;

/** A participant of a count whose approved leave covers its activity. */
export interface CoveredParticipant {
  studentId: string;
  name: string;
  nim: string;
  /** What the count keeps for them. */
  isAbsent: boolean;
  note: string;
  mark: LeaveMark;
}

function byName(a: MarkedParticipant, b: MarkedParticipant): number {
  if (a.name !== b.name) return a.name.localeCompare(b.name, "id");
  return a.nim.localeCompare(b.nim);
}

function markedOf(covered: CoveredParticipant): MarkedParticipant {
  const { studentId, name, nim, note } = covered;
  if (covered.mark === "leave") {
    return { studentId, name, nim, status: "leave", note };
  }
  return { studentId, name, nim, status: "present", note: itmkNote(note) };
}

/**
 * An announced count as approved leave makes it, whatever the count
 * keeps: a participant on Izin pesiar or Izin khusus is Izin and leaves
 * Hadir and Tidak hadir, and one on ITMK is Hadir with the note ITMK.
 * Rincian lists both.
 */
export function withLeave(
  attendance: AnnouncedAttendance,
  covered: CoveredParticipant[],
): AnnouncedAttendance {
  if (covered.length === 0) return attendance;
  const coveredIds = new Set(covered.map((each) => each.studentId));
  let { present, absent } = attendance;
  for (const each of covered) {
    if (each.isAbsent) absent -= 1;
    else present -= 1;
    if (each.mark === "itmk") present += 1;
  }
  const marked = attendance.marked
    .filter((row) => !coveredIds.has(row.studentId))
    .concat(covered.map(markedOf))
    .sort(byName);
  return { ...attendance, present, absent, marked };
}
