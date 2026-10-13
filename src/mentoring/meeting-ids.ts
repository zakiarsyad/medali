/**
 * How many times a group meets its mentor in one academic period. The
 * prototype's value, to be confirmed by the campus before launch.
 */
export const MEETINGS_PER_PERIOD = 4;

/** What a member can be marked at a meeting, in the order the form offers them. */
export const ATTENDANCE_MARKS = [
  "present",
  "excused",
  "sick",
  "absent",
] as const;

export type AttendanceMark = (typeof ATTENDANCE_MARKS)[number];

/** The mark of each student at a meeting, by the id of the student. */
export type MarksByStudent = Record<string, AttendanceMark>;
