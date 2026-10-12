import { and, eq, isNull } from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  cohortAssignmentGroups,
  mentorGroupMembers,
  mentorGroupMentors,
  mentorGroups,
} from "@/db/schema";
import type { GroupNumber, GroupToFix } from "./fix-check";

/** A group of a draft that becomes a kelompok pengasuhan. */
export interface GroupToStart extends GroupToFix {
  /** The id of the group of the draft. */
  id: string;
}

/** The numbers the groups in force of an angkatan hold. */
export function readLiveNumbers(
  db: Database,
  cohortYear: number,
): Promise<GroupNumber[]> {
  return db
    .select({
      studyProgramId: mentorGroups.studyProgramId,
      entryPath: mentorGroups.entryPath,
      number: mentorGroups.number,
    })
    .from(mentorGroups)
    .where(
      and(
        eq(mentorGroups.cohortYear, cohortYear),
        isNull(mentorGroups.endedAt),
      ),
    );
}

async function startLiveGroup(
  tx: Database,
  group: GroupToStart,
  cohortYear: number,
  startsOn: string,
): Promise<void> {
  const { studyProgramId, entryPath, number } = group;
  const [live] = await tx
    .insert(mentorGroups)
    .values({ studyProgramId, cohortYear, entryPath, number, startsOn })
    .returning({ id: mentorGroups.id });
  if (!live) throw new Error("The mentor group was not added.");
  await tx
    .insert(mentorGroupMentors)
    .values({ groupId: live.id, mentorId: group.mentorId, startsOn });
  if (group.studentIds.length > 0) {
    const members = group.studentIds.map((studentId) => ({
      studentId,
      groupId: live.id,
    }));
    await tx.insert(mentorGroupMembers).values(members);
  }
  await tx
    .update(cohortAssignmentGroups)
    .set({ mentorGroupId: live.id })
    .where(eq(cohortAssignmentGroups.id, group.id));
}

/**
 * Makes each group of a draft a kelompok pengasuhan in force: the group
 * with its members and its mentor of today, both from "Berlaku mulai".
 * The group of the draft then names the kelompok it became.
 */
export async function startLiveGroups(
  tx: Database,
  groups: GroupToStart[],
  cohortYear: number,
  startsOn: string,
): Promise<void> {
  for (const group of groups) {
    await startLiveGroup(tx, group, cohortYear, startsOn);
  }
}
