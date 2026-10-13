import {
  type AttendanceMark,
  MEETINGS_PER_PERIOD,
} from "@/mentoring/meeting-ids";
import { averageAttendance } from "./attendance-average";
import { countMarks, type MarkCounts } from "./attendance-marks";

/** A meeting whose attendance list is saved. */
export interface StoredMeeting {
  id: string;
  number: number;
  heldOn: string;
  topic: string;
  /** Which save of the list this is, counted from 1. */
  version: number;
}

export interface StoredMark {
  meetingId: string;
  studentId: string;
  mark: AttendanceMark;
}

/** One of the cards "Pertemuan 1" to the last. */
export interface MeetingCard {
  number: number;
  /** Null for a meeting that is not filled in. */
  stored: (StoredMeeting & { counts: MarkCounts }) | null;
}

export interface MeetingsOverview {
  cards: MeetingCard[];
  /** "Pertemuan terlaksana". */
  held: number;
  /** "Rerata kehadiran pengasuhan" as a whole percent, or null for none. */
  average: number | null;
}

/** The numbers of the meetings of a period, from 1. */
export const MEETING_NUMBERS = Array.from(
  { length: MEETINGS_PER_PERIOD },
  (_, place) => place + 1,
);

/** The marks gathered by the meeting or by the student they are of. */
function marksBy(
  marks: readonly StoredMark[],
  key: "meetingId" | "studentId",
): Map<string, AttendanceMark[]> {
  const gathered = new Map<string, AttendanceMark[]>();
  for (const mark of marks) {
    const sofar = gathered.get(mark[key]) ?? [];
    gathered.set(mark[key], [...sofar, mark.mark]);
  }
  return gathered;
}

/**
 * What the tab shows of one group in a period: a card for each meeting,
 * how many are filled in, and the average. `marks` are those of the
 * meetings given. Only the marks of the members given count, the Aktif
 * members of today, so the cards, the form and the average agree. A mark
 * kept for a student who has left is not counted.
 */
export function meetingsOverview(
  memberIds: readonly string[],
  meetings: readonly StoredMeeting[],
  marks: readonly StoredMark[],
): MeetingsOverview {
  const ofMembers = marks.filter((mark) => memberIds.includes(mark.studentId));
  const byMeeting = marksBy(ofMembers, "meetingId");
  const byMember = marksBy(ofMembers, "studentId");

  const cards = MEETING_NUMBERS.map((number): MeetingCard => {
    const meeting = meetings.find((each) => each.number === number);
    if (meeting === undefined) return { number, stored: null };
    const counts = countMarks(byMeeting.get(meeting.id) ?? []);
    return { number, stored: { ...meeting, counts } };
  });
  return {
    cards,
    held: meetings.length,
    average: averageAttendance([...byMember.values()]),
  };
}
