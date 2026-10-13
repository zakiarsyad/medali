import { and, eq, isNull, lte } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { mentorGroupMentors, mentorReplacements } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import { REPLACEMENT_REASON_TITLES } from "./replacement-ids";

/** What is read of a replacement to give its group the new mentor. */
export type ReplacementToCarryOut = Pick<
  typeof mentorReplacements.$inferSelect,
  "id" | "groupId" | "oldMentorId" | "newMentorId" | "startsOn" | "reason"
>;

/**
 * Ends the line of the old mentor on the start date, with the reason as
 * the form words it. False when the old mentor does not hold the group
 * today, or took it only after the start date: no line is ended then.
 */
async function endOldLine(
  tx: Database,
  replacement: ReplacementToCarryOut,
): Promise<boolean> {
  const ended = await tx
    .update(mentorGroupMentors)
    .set({
      endsOn: replacement.startsOn,
      endReason: REPLACEMENT_REASON_TITLES[replacement.reason],
    })
    .where(
      and(
        eq(mentorGroupMentors.groupId, replacement.groupId),
        eq(mentorGroupMentors.mentorId, replacement.oldMentorId),
        isNull(mentorGroupMentors.endsOn),
        lte(mentorGroupMentors.startsOn, replacement.startsOn),
      ),
    )
    .returning({ id: mentorGroupMentors.id });
  return ended.length > 0;
}

/**
 * Gives the group of a replacement its new mentor: the line of the old
 * mentor ends and the line of the new one starts, both on the start date
 * whatever day it is today, and the replacement keeps the moment. From
 * then on every read and every save that goes by the mentor of today
 * takes the new mentor. Run inside the caller's transaction, which holds
 * the group. False, with nothing changed, when the old mentor is not the
 * mentor of today of the group.
 */
export async function carryOutReplacement(
  tx: Database,
  replacement: ReplacementToCarryOut,
): Promise<boolean> {
  if (!(await endOldLine(tx, replacement))) return false;
  await tx.insert(mentorGroupMentors).values({
    groupId: replacement.groupId,
    mentorId: replacement.newMentorId,
    startsOn: replacement.startsOn,
  });
  await tx
    .update(mentorReplacements)
    .set({ carriedOutAt: WRITTEN_NOW })
    .where(eq(mentorReplacements.id, replacement.id));
  return true;
}
