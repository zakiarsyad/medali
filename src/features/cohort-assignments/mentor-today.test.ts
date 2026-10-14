import { describe, expect, it } from "vitest";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { carryOutDueReplacements } from "@/mentoring/due-replacements";
import { addTestReplacement } from "@/mentoring/test-replacements";
import { readAssignment } from "./stored-assignment";
import {
  addCompleteTestDraft,
  addFixedTestDraft,
  testGroupsOf,
} from "./test-drafts";
import { testLiveIdOf } from "./test-live-groups";
import { addTestMentor, onlyProgram } from "./test-records";
import { EVERY_ROW } from "./visible-assignments";

const inTestDatabase = withTestDatabase();

const YEAR = 2070;
const FIRST_NIM = 9970000001;
const TAG = "UJIPKINI";
const FIXED_ON = "2070-09-01";
const REPLACED_ON = "2070-10-05";

/**
 * A fixed penetapan and a replacement of the mentor of its first group
 * by a new mentor, set to start on `REPLACED_ON` and not carried out yet.
 */
async function addFixedWithReplacement(db: Database) {
  const draft = await addFixedTestDraft(db, YEAR, FIRST_NIM, TAG);
  const [first] = await testGroupsOf(db, YEAR, draft.large);
  if (!first?.mentor) throw new Error("No group was fixed with a mentor.");
  const newMentorId = await addTestMentor(db, {
    name: `Pengasuh ${TAG} Baru`,
    title: "M.Ak.",
  });
  await addTestReplacement(db, {
    groupId: await testLiveIdOf(db, first.id),
    oldMentorId: first.mentor.id,
    newMentorId,
    startsOn: REPLACED_ON,
  });
  return { ...draft, first, oldMentor: first.mentor, newMentorId };
}

/** The mentor and its first day the tab reads for each group, by group id. */
async function shownMentors(db: Database, limit: RowLimit = EVERY_ROW) {
  const shown = await readAssignment(db, limit, YEAR, false);
  const mentors = new Map<
    string,
    { id: string | undefined; since: string | null }
  >();
  for (const group of shown?.groups ?? []) {
    mentors.set(group.id, { id: group.mentor?.id, since: group.mentorSince });
  }
  return mentors;
}

describe("the mentor of a group of a fixed penetapan", () => {
  it("is the mentor of today once a replacement took effect, since the day it did", async () => {
    await inTestDatabase(async (db) => {
      const fixed = await addFixedWithReplacement(db);
      await carryOutDueReplacements(db, REPLACED_ON);

      const shown = await readAssignment(db, EVERY_ROW, YEAR, false);
      const first = shown?.groups.find((group) => group.id === fixed.first.id);

      expect(first?.mentor).toEqual({
        id: fixed.newMentorId,
        name: `Pengasuh ${TAG} Baru`,
        title: "M.Ak.",
      });
      expect(first?.mentorSince).toBe(REPLACED_ON);
    });
  });

  it("stays the mentor it was fixed with, since the day it was fixed, while a replacement waits for its date", async () => {
    await inTestDatabase(async (db) => {
      const fixed = await addFixedWithReplacement(db);

      const mentors = await shownMentors(db);

      expect(mentors.get(fixed.first.id)).toEqual({
        id: fixed.oldMentor.id,
        since: FIXED_ON,
      });
    });
  });

  it("gives a head of a study program the mentor of today of the groups of that program only", async () => {
    await inTestDatabase(async (db) => {
      const fixed = await addFixedWithReplacement(db);
      await carryOutDueReplacements(db, REPLACED_ON);

      const own = await shownMentors(db, onlyProgram(fixed.large));
      const other = await shownMentors(db, onlyProgram(fixed.small));

      expect(own.size).toBe(2);
      expect(own.get(fixed.first.id)).toEqual({
        id: fixed.newMentorId,
        since: REPLACED_ON,
      });
      expect(other.size).toBe(1);
      expect(other.has(fixed.first.id)).toBe(false);
    });
  });
});

describe("the mentor of a group of a penetapan that is not fixed", () => {
  it("is the one chosen, with no first day", async () => {
    await inTestDatabase(async (db) => {
      const draft = await addCompleteTestDraft(db, YEAR, FIRST_NIM, TAG);
      const [first] = await testGroupsOf(db, YEAR, draft.large);

      expect(first?.mentor).not.toBeNull();
      expect(first?.mentorSince).toBeNull();
    });
  });
});
