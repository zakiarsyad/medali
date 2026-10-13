import { and, eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { accounts, mentorReplacements } from "@/db/schema";
import { IS_WAITING } from "@/mentoring/waiting-replacement";

/** The replacement of a group that waits for its start date: Terjadwal. */
export interface WaitingReplacement {
  id: string;
  /** "Tanggal efektif". */
  startsOn: string;
  newMentorName: string;
}

/**
 * The replacement of a group that waits for its start date, with the
 * mentor who is to take the group. A group has one at most. Null for a
 * group without one. The caller has checked that the group may be seen.
 */
export async function readWaitingReplacementOf(
  db: Database,
  groupId: string,
): Promise<WaitingReplacement | null> {
  const [waiting] = await db
    .select({
      id: mentorReplacements.id,
      startsOn: mentorReplacements.startsOn,
      newMentorName: accounts.name,
    })
    .from(mentorReplacements)
    .innerJoin(accounts, eq(accounts.id, mentorReplacements.newMentorId))
    .where(and(eq(mentorReplacements.groupId, groupId), IS_WAITING));
  return waiting ?? null;
}
