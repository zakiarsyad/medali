import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { carryOutDueReplacements } from "@/mentoring/due-replacements";
import { addTestReplacement } from "@/mentoring/test-replacements";
import { cancelAssignment } from "./cancel-assignment";
import { fixAssignment } from "./fix-assignment";
import { addFixedTestDraft, testDraftOf, testGroupsOf } from "./test-drafts";
import { testLiveGroupsOf, testLiveIdOf } from "./test-live-groups";
import { addTestMentor } from "./test-records";

const inTestDatabase = withTestDatabase();

const YEAR = 2076;
const FIRST_NIM = 9976000001;
const TAG = "UJIPBATAL";
const REPLACED_ON = "2076-10-05";
/** A fixed penetapan stands at version 3: formed, mentors filled, fixed. */
const KEY = { cohortYear: YEAR, version: 3 };

/**
 * A fixed penetapan whose first group was given a new mentor by a
 * replacement that took effect.
 */
async function addReplacedSinceFixed(db: Database) {
  const draft = await addFixedTestDraft(db, YEAR, FIRST_NIM, TAG);
  const [first] = await testGroupsOf(db, YEAR, draft.large);
  if (!first?.mentor) throw new Error("No group was fixed with a mentor.");
  const newMentorId = await addTestMentor(db, { name: `Pengasuh ${TAG} Baru` });
  await addTestReplacement(db, {
    groupId: await testLiveIdOf(db, first.id),
    oldMentorId: first.mentor.id,
    newMentorId,
    startsOn: REPLACED_ON,
  });
  await carryOutDueReplacements(db, REPLACED_ON);
  return { ...draft, first, newMentorId };
}

/** The mentor the draft holds for each of its groups, by group id. */
async function draftMentors(db: Database) {
  const draft = await testDraftOf(db, YEAR);
  const mentors = new Map<string, string | undefined>();
  for (const group of draft.groups) mentors.set(group.id, group.mentor?.id);
  return mentors;
}

/** The mentor of today of each group in force, by program studi and number. */
async function liveMentors(db: Database) {
  const groups = await testLiveGroupsOf(db, YEAR);
  const mentors = new Map<string, string[]>();
  for (const group of groups) {
    if (group.endedAt !== null) continue;
    mentors.set(
      `${group.studyProgramId}-${group.number}`,
      group.mentors.map((line) => line.mentorId),
    );
  }
  return mentors;
}

describe("cancelAssignment after the mentor of a group was replaced", () => {
  it("leaves a draft that holds, for each group, the mentor it had at that moment", async () => {
    await inTestDatabase(async (db) => {
      const replaced = await addReplacedSinceFixed(db);
      const before = await draftMentors(db);

      const cancelled = await cancelAssignment(db, replaced.head, KEY);

      expect(cancelled).toEqual({ ok: true, value: null });
      const after = await draftMentors(db);
      expect(after.get(replaced.first.id)).toBe(replaced.newMentorId);
      expect(after).toEqual(before);
      const draft = await testDraftOf(db, YEAR);
      expect(draft.groups.map((group) => group.mentorSince)).toEqual([
        null,
        null,
        null,
      ]);
    });
  });

  it("gives every group the same mentor when it is fixed again without a change", async () => {
    await inTestDatabase(async (db) => {
      const replaced = await addReplacedSinceFixed(db);
      const before = await liveMentors(db);
      await cancelAssignment(db, replaced.head, KEY);
      expect(await liveMentors(db)).toEqual(new Map());

      const fixed = await fixAssignment(db, replaced.head, {
        cohortYear: YEAR,
        version: 4,
        decreeNumber: `KEP-${TAG}`,
        effectiveOn: "2076-11-01",
      });

      expect(fixed).toEqual({ ok: true, value: null });
      const after = await liveMentors(db);
      expect(after).toEqual(before);
      expect([...after.values()].flat()).toContain(replaced.newMentorId);
    });
  });
});
