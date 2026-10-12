import type { cohortAssignmentGroups } from "@/db/schema";

type StoredGroup = typeof cohortAssignmentGroups.$inferSelect;

/** What moving a member reads of a group being prepared. */
export interface GroupWithMembers
  extends Pick<StoredGroup, "id" | "studyProgramId" | "entryPath"> {
  studentIds: string[];
}

type GroupPlace = Pick<GroupWithMembers, "id" | "studyProgramId" | "entryPath">;

/**
 * Whether a member may move from one group to another: only to another
 * group of the same program studi and jalur.
 */
export function mayMoveBetween(from: GroupPlace, to: GroupPlace): boolean {
  if (from.id === to.id) return false;
  if (from.studyProgramId !== to.studyProgramId) return false;
  return from.entryPath === to.entryPath;
}

/** The groups "Pindahkan ke" offers for a member of a group. */
export function moveTargets<G extends GroupPlace>(
  groups: G[],
  fromGroupId: string,
): G[] {
  const from = groups.find((group) => group.id === fromGroupId);
  if (!from) return [];
  return groups.filter((group) => mayMoveBetween(from, group));
}

/**
 * The groups after a student moved to another group of the same draft,
 * or null when the move is refused: the student is in no group, the group
 * is not one of these, or it is of another program studi or jalur.
 */
export function moveMember<G extends GroupWithMembers>(
  groups: G[],
  studentId: string,
  toGroupId: string,
): G[] | null {
  const from = groups.find((group) => group.studentIds.includes(studentId));
  const to = groups.find((group) => group.id === toGroupId);
  if (!from || !to) return null;
  if (!mayMoveBetween(from, to)) return null;
  return groups.map((group) => {
    if (group.id === from.id) {
      const staying = group.studentIds.filter((id) => id !== studentId);
      return { ...group, studentIds: staying };
    }
    if (group.id === to.id) {
      return { ...group, studentIds: [...group.studentIds, studentId] };
    }
    return group;
  });
}
