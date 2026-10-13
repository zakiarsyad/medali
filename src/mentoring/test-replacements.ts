import { eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { mentorReplacements } from "@/db/schema";

/** Made-up replacements for the checks of every area that reads them. */

type NewReplacement = typeof mentorReplacements.$inferInsert;

type TestReplacement = Pick<
  NewReplacement,
  "groupId" | "oldMentorId" | "newMentorId"
> &
  Partial<NewReplacement>;

/**
 * A stored replacement that waits for its start date unless it says when
 * it was carried out. Set by the old mentor's account unless it says who.
 */
export async function addTestReplacement(
  db: Database,
  replacement: TestReplacement,
): Promise<string> {
  const [added] = await db
    .insert(mentorReplacements)
    .values({
      startsOn: "2026-10-01",
      reason: "own_request",
      letterNumber: "ND-UJI/2026",
      oldMentorStatus: "reserve",
      setBy: replacement.oldMentorId,
      setAt: new Date(),
      ...replacement,
    })
    .returning({ id: mentorReplacements.id });
  if (!added) throw new Error("The replacement was not added.");
  return added.id;
}

/** The replacements of a group, the one set first first. */
export function testReplacementsOf(db: Database, groupId: string) {
  return db
    .select()
    .from(mentorReplacements)
    .where(eq(mentorReplacements.groupId, groupId))
    .orderBy(mentorReplacements.setAt);
}
