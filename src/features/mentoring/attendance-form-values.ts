import type { AttendanceMark, MarksByStudent } from "@/mentoring/meeting-ids";
import { sameMarks } from "./attendance-marks";

/** What the form "Daftar hadir pertemuan" holds. */
export interface AttendanceValues {
  heldOn: string;
  topic: string;
  marks: MarksByStudent;
}

/** A list in which every one of these members has the same mark. */
export function allMarked(
  memberIds: readonly string[],
  mark: AttendanceMark,
): MarksByStudent {
  const marks: MarksByStudent = {};
  for (const id of memberIds) marks[id] = mark;
  return marks;
}

/**
 * The marks a form opens with when its meeting has a list already: for
 * each member of today the mark kept, and Alpa for a member who has none,
 * as one who joined the group after the list was saved.
 */
export function marksToCorrect(
  memberIds: readonly string[],
  kept: MarksByStudent,
): MarksByStudent {
  const marks: MarksByStudent = {};
  for (const id of memberIds) marks[id] = kept[id] ?? "absent";
  return marks;
}

/** The marks the form shows for these members, as a list in their order. */
export function marksOf(
  marks: MarksByStudent,
  memberIds: readonly string[],
): AttendanceMark[] {
  const listed: AttendanceMark[] = [];
  for (const id of memberIds) {
    const mark = marks[id];
    if (mark !== undefined) listed.push(mark);
  }
  return listed;
}

/**
 * Whether the form holds something that is not saved: its day, its topic
 * or a mark differs from what it held when it was opened or last saved.
 */
export function hasUnsavedChanges(
  kept: AttendanceValues,
  now: AttendanceValues,
): boolean {
  const isSame =
    kept.heldOn === now.heldOn &&
    kept.topic === now.topic &&
    sameMarks(kept.marks, now.marks);
  return !isSame;
}
