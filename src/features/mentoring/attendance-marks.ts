import { ATTENDANCE_MARKS, type AttendanceMark } from "@/mentoring/meeting-ids";

/** What the screens call each mark. */
export const MARK_TITLES: Record<AttendanceMark, string> = {
  present: "Hadir",
  excused: "Izin",
  sick: "Sakit",
  absent: "Alpa",
};

export function isAttendanceMark(sent: string): sent is AttendanceMark {
  return ATTENDANCE_MARKS.some((mark) => mark === sent);
}

/** How many members have each mark. */
export type MarkCounts = Record<AttendanceMark, number>;

export function countMarks(marks: readonly AttendanceMark[]): MarkCounts {
  const counts: MarkCounts = { present: 0, excused: 0, sick: 0, absent: 0 };
  for (const mark of marks) counts[mark] += 1;
  return counts;
}

/**
 * The counts as one line, such as "Hadir 9 · izin 0 · sakit 1 · alpa 0":
 * only the first word starts with a capital.
 */
export function countWords(counts: MarkCounts, between: string): string {
  const parts = ATTENDANCE_MARKS.map(
    (mark) => `${MARK_TITLES[mark]} ${counts[mark].toLocaleString("id-ID")}`,
  );
  const [first = "", ...rest] = parts;
  return [first, ...rest.map((part) => part.toLowerCase())].join(between);
}
