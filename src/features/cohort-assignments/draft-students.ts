import type { NewStudent } from "./form-groups";

/** Where a student belongs and a group stands: the program studi and jalur. */
type Place = Pick<NewStudent, "studyProgramId" | "entryPath">;

/** What the count reads of a student who waits for a group. */
export type PlacedStudent = Place & Pick<NewStudent, "id">;

/** What the count reads of a group of a draft. */
export interface PlacedGroup extends Place {
  members: { id: string }[];
}

/** The students of an angkatan that its draft does not place rightly. */
export interface DraftStudentCounts {
  /** Waiting students who are in no group of the draft. */
  outsideDraft: number;
  /** Members whose program studi or jalur is not that of their group. */
  inWrongGroup: number;
}

function groupOfEachMember(groups: PlacedGroup[]): Map<string, PlacedGroup> {
  const groupOf = new Map<string, PlacedGroup>();
  for (const group of groups) {
    for (const member of group.members) groupOf.set(member.id, group);
  }
  return groupOf;
}

function isInPlace(student: Place, group: Place): boolean {
  return (
    student.studyProgramId === group.studyProgramId &&
    student.entryPath === group.entryPath
  );
}

/**
 * Counts the students who wait for a group and whom the draft would leave
 * out or put in a group of another program studi or jalur. Both happen
 * only after the groups were formed: a student joined the angkatan or
 * became Aktif again, or their program studi or jalur was changed. A
 * member who does not wait any more is not counted here: the penetapan
 * itself checks that.
 */
export function countDraftStudents(
  groups: PlacedGroup[],
  waiting: PlacedStudent[],
): DraftStudentCounts {
  const groupOf = groupOfEachMember(groups);
  const counts = { outsideDraft: 0, inWrongGroup: 0 };
  for (const student of waiting) {
    const group = groupOf.get(student.id);
    if (group === undefined) {
      counts.outsideDraft += 1;
      continue;
    }
    if (!isInPlace(student, group)) counts.inWrongGroup += 1;
  }
  return counts;
}
