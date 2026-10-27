// Sample Tahun akademik of this file: 7400 to 7400.
// Sample NIMs of this file: 9961000800 to 9961000899.
import { describe, expect, it } from "vitest";
import type { CoachingStatus } from "@/character-scores/coaching-status";
import type { Database } from "@/db/connect";
import { coachingStatuses } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { countNeedsCoaching, needsCoachingPercent } from "./needs-coaching";
import { addTestGroup, addTestProgram } from "./test-records";
import {
  addTestAssessor,
  addTestScoredMember,
  allScores,
  type TestGroupOf,
} from "./test-scores";

const inTestDatabase = withTestDatabase();

/** A Rerata of 60: on Pembinaan karakter. */
const LISTED = allScores(60);
/** A Rerata of 80: not on it. */
const NOT_LISTED = allScores(80);

async function addGroup(db: Database): Promise<TestGroupOf> {
  const programId = await addTestProgram(db, "UJIPERLUPEMBINAAN");
  const id = await addTestGroup(db, programId);
  const by = await addTestAssessor(db, 7400);
  return { id, programId, by };
}

async function addStatus(
  db: Database,
  group: TestGroupOf,
  studentId: string,
  status: CoachingStatus,
): Promise<void> {
  await db.insert(coachingStatuses).values({
    studentId,
    status,
    changedBy: group.by.enteredBy,
    changedAt: new Date(),
  });
}

describe("countNeedsCoaching", () => {
  it("counts the Aktif members on Pembinaan karakter who are not yet Selesai", async () => {
    await inTestDatabase(async (db) => {
      const group = await addGroup(db);
      await addTestScoredMember(db, group, "9961000801", LISTED);
      const done = await addTestScoredMember(db, group, "9961000802", LISTED);
      await addStatus(db, group, done, "done");
      await addTestScoredMember(db, group, "9961000803", NOT_LISTED);
      await addTestScoredMember(db, group, "9961000804", NOT_LISTED);
      await addTestScoredMember(db, group, "9961000805", LISTED, {
        status: "on_leave",
      });

      expect(await countNeedsCoaching(db, group.id)).toBe(1);
    });
  });

  it("counts a member with a saved status that is not Selesai", async () => {
    await inTestDatabase(async (db) => {
      const group = await addGroup(db);
      const watched = await addTestScoredMember(
        db,
        group,
        "9961000806",
        LISTED,
      );
      await addStatus(db, group, watched, "monitoring");

      expect(await countNeedsCoaching(db, group.id)).toBe(1);
    });
  });

  it("leaves out a Non aktif or removed member and one of another group", async () => {
    await inTestDatabase(async (db) => {
      const group = await addGroup(db);
      await addTestScoredMember(db, group, "9961000807", LISTED, {
        status: "inactive",
      });
      await addTestScoredMember(db, group, "9961000808", LISTED, {
        deletedAt: new Date(),
      });
      const otherId = await addTestGroup(db, group.programId, { number: 2 });
      await addTestScoredMember(
        db,
        { ...group, id: otherId },
        "9961000809",
        LISTED,
      );

      expect(await countNeedsCoaching(db, group.id)).toBe(0);
      expect(await countNeedsCoaching(db, otherId)).toBe(1);
    });
  });

  it("is 0 when nobody is on Pembinaan karakter", async () => {
    await inTestDatabase(async (db) => {
      const group = await addGroup(db);
      await addTestScoredMember(db, group, "9961000810", NOT_LISTED);
      await addTestScoredMember(db, group, "9961000811", null);

      expect(await countNeedsCoaching(db, group.id)).toBe(0);
    });
  });
});

describe("needsCoachingPercent", () => {
  it("is the share of the Aktif members, rounded to a whole number", () => {
    expect(needsCoachingPercent(1, 4)).toBe(25);
    expect(needsCoachingPercent(1, 3)).toBe(33);
    expect(needsCoachingPercent(2, 3)).toBe(67);
  });

  it("is 0 when the group has no Aktif member", () => {
    expect(needsCoachingPercent(0, 0)).toBe(0);
  });
});
