import {
  ATTENDANCE_MARKS,
  type AttendanceMark,
  type MarksByStudent,
} from "@/mentoring/meeting-ids";

/** Whether two lists mark the same students, each with the same mark. */
export function sameMarks(a: MarksByStudent, b: MarksByStudent): boolean {
  const ids = Object.keys(a);
  if (ids.length !== Object.keys(b).length) return false;
  return ids.every((id) => a[id] === b[id]);
}

/**
 * The members a list holds no mark for: those who joined the group after
 * the list was saved.
 */
export function withoutMark(
  memberIds: readonly string[],
  marks: MarksByStudent,
): string[] {
  return memberIds.filter((id) => !Object.hasOwn(marks, id));
}

/** What the screens call each mark. */
export const MARK_TITLES: Record<AttendanceMark, string> = {
  present: "Hadir",
  excused: "Izin",
  sick: "Sakit",
  absent: "Alpa",
};

/** What the screens call having no mark in a saved list. */
export const NO_MARK_TITLE = "Tidak tercatat";

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
