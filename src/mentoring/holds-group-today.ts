import { and, eq, isNull } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { mentorGroupMentors, mentorGroups } from "@/db/schema";

/**
 * Whether an account is the mentor of today of any group. A group held
 * before does not count: its mentor line has ended. Neither does a group
 * that is ended itself, which nobody can replace the mentor of.
 */
export async function holdsGroupToday(
  db: Database,
  accountId: string,
): Promise<boolean> {
  const [held] = await db
    .select({ id: mentorGroupMentors.id })
    .from(mentorGroupMentors)
    .innerJoin(mentorGroups, eq(mentorGroups.id, mentorGroupMentors.groupId))
    .where(
      and(
        eq(mentorGroupMentors.mentorId, accountId),
        isNull(mentorGroupMentors.endsOn),
        isNull(mentorGroups.endedAt),
      ),
    )
    .limit(1);
  return held !== undefined;
}
