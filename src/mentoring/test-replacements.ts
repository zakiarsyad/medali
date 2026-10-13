import { asc, eq, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  accountRoles,
  accounts,
  mentorGroupMentors,
  mentorGroups,
  mentorReplacements,
  studyPrograms,
} from "@/db/schema";

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

export const TEST_HELD_SINCE = "2026-09-01";

export interface TestGroupToReplace {
  groupId: string;
  oldMentorId: string;
  newMentorId: string;
}

async function addTestAccount(db: Database, name: string): Promise<string> {
  const [added] = await db
    .insert(accounts)
    .values({ name })
    .returning({ id: accounts.id });
  if (!added) throw new Error("The account was not added.");
  return added.id;
}

/**
 * A group of a program of its own, held by an old mentor since
 * `TEST_HELD_SINCE`, and a spare mentor with the Pengasuh role. The name
 * of the program is also its code, and must be one no other check uses.
 */
export async function addTestGroupToReplace(
  db: Database,
  programName: string,
): Promise<TestGroupToReplace> {
  const [program] = await db
    .insert(studyPrograms)
    .values({ name: programName, code: programName })
    .returning({ id: studyPrograms.id });
  if (!program) throw new Error("The study program was not added.");
  const [group] = await db
    .insert(mentorGroups)
    .values({
      studyProgramId: program.id,
      cohortYear: 2026,
      entryPath: "regular",
      number: 1,
      startsOn: TEST_HELD_SINCE,
    })
    .returning({ id: mentorGroups.id });
  if (!group) throw new Error("The mentor group was not added.");
  const oldMentorId = await addTestAccount(db, `Pengasuh Lama ${programName}`);
  const newMentorId = await addTestAccount(db, `Pengasuh Baru ${programName}`);
  await db.insert(accountRoles).values([
    { accountId: oldMentorId, role: "mentor" },
    { accountId: newMentorId, role: "mentor" },
  ]);
  await db.insert(mentorGroupMentors).values({
    groupId: group.id,
    mentorId: oldMentorId,
    startsOn: TEST_HELD_SINCE,
  });
  return { groupId: group.id, oldMentorId, newMentorId };
}

/** The mentor lines of a group, the one that started first first. */
export function testMentorLinesOf(db: Database, groupId: string) {
  return db
    .select({
      mentorId: mentorGroupMentors.mentorId,
      startsOn: mentorGroupMentors.startsOn,
      endsOn: mentorGroupMentors.endsOn,
      endReason: mentorGroupMentors.endReason,
    })
    .from(mentorGroupMentors)
    .where(eq(mentorGroupMentors.groupId, groupId))
    .orderBy(
      asc(mentorGroupMentors.startsOn),
      asc(sql`${mentorGroupMentors.endsOn} is null`),
    );
}

/** The replacements of a group, the one set first first. */
export function testReplacementsOf(db: Database, groupId: string) {
  return db
    .select()
    .from(mentorReplacements)
    .where(eq(mentorReplacements.groupId, groupId))
    .orderBy(mentorReplacements.setAt);
}
