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
 * each member of today the mark kept. A member who has none, as one who
 * joined the group after the list was saved, starts without a mark: an
 * Alpa would lower their share for a meeting held before they joined.
 */
export function marksToCorrect(
  memberIds: readonly string[],
  kept: MarksByStudent,
): MarksByStudent {
  const marks: MarksByStudent = {};
  for (const id of memberIds) {
    const mark = kept[id];
    if (mark !== undefined) marks[id] = mark;
  }
  return marks;
}

/**
 * What "Tandai semua hadir" gives: every member Hadir, but a member who
 * may stay without a mark and has none in the form stays without one. A
 * Hadir for a meeting held before they joined could not be taken back
 * once saved.
 */
export function allPresent(
  memberIds: readonly string[],
  unmarkedIds: readonly string[],
  marks: MarksByStudent,
): MarksByStudent {
  const marked = memberIds.filter((id) => {
    const staysUnmarked = unmarkedIds.includes(id) && marks[id] === undefined;
    return !staysUnmarked;
  });
  return allMarked(marked, "present");
}

/** These marks with that of one student set, or taken away with null. */
export function withMark(
  marks: MarksByStudent,
  studentId: string,
  mark: AttendanceMark | null,
): MarksByStudent {
  const changed: MarksByStudent = {};
  for (const [id, kept] of Object.entries(marks)) {
    if (id !== studentId) changed[id] = kept;
  }
  if (mark !== null) changed[studentId] = mark;
  return changed;
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
