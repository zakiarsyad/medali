import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { mentorGroupMentors, mentorGroups } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { carryOutDueReplacements } from "./due-replacements";
import {
  addTestGroupToReplace,
  addTestReplacement,
  TEST_HELD_SINCE,
  type TestGroupToReplace,
  testMentorLinesOf,
  testReplacementsOf,
} from "./test-replacements";

const inTestDatabase = withTestDatabase();

const PROGRAM = "UJIJATUHTEMPO";
const STARTS_ON = "2083-03-10";
/** The app is first used some days after the start date. */
const OPENED_ON = "2083-03-14";

const OLD_LINE_OPEN = {
  startsOn: TEST_HELD_SINCE,
  endsOn: null,
  endReason: null,
};

/** A group with a replacement that waits for `STARTS_ON`. */
async function addWaiting(
  db: Database,
  more: Partial<Parameters<typeof addTestReplacement>[1]> = {},
): Promise<TestGroupToReplace> {
  const made = await addTestGroupToReplace(db, PROGRAM);
  await addTestReplacement(db, {
    ...made,
    startsOn: STARTS_ON,
    reason: "retirement",
    oldMentorStatus: "inactive",
    ...more,
  });
  return made;
}

/** Whether the replacement of the group still waits, and its mentor lines. */
async function stateOf(db: Database, made: TestGroupToReplace) {
  const [replacement] = await testReplacementsOf(db, made.groupId);
  return {
    isCarriedOut: replacement?.carriedOutAt !== null,
    lines: await testMentorLinesOf(db, made.groupId),
  };
}

describe("carryOutDueReplacements", () => {
  it("gives the group its new mentor once the start date has come, with both lines on the start date", async () => {
    await inTestDatabase(async (db) => {
      const made = await addWaiting(db);

      await carryOutDueReplacements(db, OPENED_ON);

      expect(await stateOf(db, made)).toEqual({
        isCarriedOut: true,
        lines: [
          {
            mentorId: made.oldMentorId,
            startsOn: TEST_HELD_SINCE,
            endsOn: STARTS_ON,
            endReason: "Pensiun",
          },
          {
            mentorId: made.newMentorId,
            startsOn: STARTS_ON,
            endsOn: null,
            endReason: null,
          },
        ],
      });
    });
  });

  it("carries it out on the start date itself, and not the day before", async () => {
    await inTestDatabase(async (db) => {
      const made = await addWaiting(db);

      await carryOutDueReplacements(db, "2083-03-09");
      const dayBefore = await stateOf(db, made);
      await carryOutDueReplacements(db, STARTS_ON);
      const onTheDay = await stateOf(db, made);

      expect(dayBefore).toEqual({
        isCarriedOut: false,
        lines: [{ mentorId: made.oldMentorId, ...OLD_LINE_OPEN }],
      });
      expect(onTheDay.isCarriedOut).toBe(true);
      expect(onTheDay.lines).toHaveLength(2);
    });
  });

  it("changes nothing when it is asked again", async () => {
    await inTestDatabase(async (db) => {
      const made = await addWaiting(db);
      await carryOutDueReplacements(db, OPENED_ON);
      const [first] = await testReplacementsOf(db, made.groupId);

      await carryOutDueReplacements(db, OPENED_ON);

      const [again] = await testReplacementsOf(db, made.groupId);
      expect(again?.carriedOutAt).toEqual(first?.carriedOutAt);
      expect(await testMentorLinesOf(db, made.groupId)).toHaveLength(2);
    });
  });

  it("leaves a cancelled replacement alone", async () => {
    await inTestDatabase(async (db) => {
      const made = await addTestGroupToReplace(db, PROGRAM);
      await addTestReplacement(db, {
        ...made,
        startsOn: STARTS_ON,
        cancelledBy: made.oldMentorId,
        cancelledAt: new Date(),
      });

      await carryOutDueReplacements(db, OPENED_ON);

      expect(await stateOf(db, made)).toEqual({
        isCarriedOut: false,
        lines: [{ mentorId: made.oldMentorId, ...OLD_LINE_OPEN }],
      });
    });
  });

  it("leaves it waiting, without a fault, when its group is ended", async () => {
    await inTestDatabase(async (db) => {
      const made = await addWaiting(db);
      await db
        .update(mentorGroups)
        .set({ endedAt: new Date(), endedBy: made.oldMentorId })
        .where(eq(mentorGroups.id, made.groupId));

      await carryOutDueReplacements(db, OPENED_ON);

      expect((await stateOf(db, made)).isCarriedOut).toBe(false);
    });
  });

  it("leaves it waiting, without a fault, when the old mentor does not hold the group any more", async () => {
    await inTestDatabase(async (db) => {
      const made = await addWaiting(db);
      await db
        .update(mentorGroupMentors)
        .set({ endsOn: "2083-03-01", endReason: "Uji" })
        .where(eq(mentorGroupMentors.groupId, made.groupId));

      await carryOutDueReplacements(db, OPENED_ON);

      const state = await stateOf(db, made);
      expect(state.isCarriedOut).toBe(false);
      expect(state.lines).toHaveLength(1);
    });
  });

  it("leaves it waiting, without a fault, when the new mentor holds a group already", async () => {
    await inTestDatabase(async (db) => {
      const made = await addWaiting(db);
      const other = await addTestGroupToReplace(db, `${PROGRAM}LAIN`);
      await db
        .update(mentorGroupMentors)
        .set({ mentorId: made.newMentorId })
        .where(eq(mentorGroupMentors.groupId, other.groupId));

      await carryOutDueReplacements(db, OPENED_ON);

      expect(await stateOf(db, made)).toEqual({
        isCarriedOut: false,
        lines: [{ mentorId: made.oldMentorId, ...OLD_LINE_OPEN }],
      });
    });
  });

  it("carries out each of several that are due", async () => {
    await inTestDatabase(async (db) => {
      const first = await addWaiting(db);
      const second = await addTestGroupToReplace(db, `${PROGRAM}DUA`);
      await addTestReplacement(db, { ...second, startsOn: "2083-03-12" });

      await carryOutDueReplacements(db, OPENED_ON);

      expect((await stateOf(db, first)).isCarriedOut).toBe(true);
      expect((await stateOf(db, second)).isCarriedOut).toBe(true);
    });
  });
});
