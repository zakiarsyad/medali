import { and, eq, isNull } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { accounts, mentorGroupMentors, mentorGroups } from "@/db/schema";
import { NOT_ENDED } from "@/mentoring/group-in-force";

/**
 * Reads a group that is in force and holds it until the transaction ends,
 * so two saves for one group never run at the same moment: the second
 * waits, and then sees what the first one saved. Held without its key, so
 * nothing that only names the group has to wait.
 */
export async function lockGroup(tx: Database, groupId: string) {
  const [group] = await tx
    .select({
      id: mentorGroups.id,
      studyProgramId: mentorGroups.studyProgramId,
    })
    .from(mentorGroups)
    .where(and(eq(mentorGroups.id, groupId), NOT_ENDED))
    .for("no key update");
  return group ?? null;
}

/** The mentor who holds a group today. Null for a group without one. */
export async function readMentorOfToday(tx: Database, groupId: string) {
  const [mentor] = await tx
    .select({
      id: accounts.id,
      name: accounts.name,
      since: mentorGroupMentors.startsOn,
    })
    .from(mentorGroupMentors)
    .innerJoin(accounts, eq(accounts.id, mentorGroupMentors.mentorId))
    .where(
      and(
        eq(mentorGroupMentors.groupId, groupId),
        isNull(mentorGroupMentors.endsOn),
      ),
    );
  return mentor ?? null;
}
