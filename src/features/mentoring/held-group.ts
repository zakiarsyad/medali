import { and, eq, isNull } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { mentorGroupMentors, mentorGroups } from "@/db/schema";
import { NOT_ENDED } from "@/mentoring/group-in-force";

/**
 * Reads a group that is in force and holds it until the transaction ends,
 * so two saves for one group never run at the same moment: the second
 * waits, and then sees what the first one saved. Held without its key, so
 * nothing that only names the group has to wait.
 */
export async function lockGroup(
  tx: Database,
  groupId: string,
): Promise<boolean> {
  const [group] = await tx
    .select({ id: mentorGroups.id })
    .from(mentorGroups)
    .where(and(eq(mentorGroups.id, groupId), NOT_ENDED))
    .for("no key update");
  return group !== undefined;
}

/** The account that holds a group today, or null for a group without a mentor. */
export async function readMentorOfToday(
  tx: Database,
  groupId: string,
): Promise<string | null> {
  const [line] = await tx
    .select({ mentorId: mentorGroupMentors.mentorId })
    .from(mentorGroupMentors)
    .where(
      and(
        eq(mentorGroupMentors.groupId, groupId),
        isNull(mentorGroupMentors.endsOn),
      ),
    );
  return line?.mentorId ?? null;
}
