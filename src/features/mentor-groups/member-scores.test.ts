// Sample Tahun akademik of this file: 4011 to 4011.
// Sample NIMs of this file: 9987650100 to 9987650199.
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestPenaltyOf,
  addTestRecorder,
} from "@/discipline-penalties/test-penalties";
import { readMemberScores } from "./member-scores";
import { addTestGroup, addTestProgram } from "./test-records";
import {
  addTestAssessor,
  addTestScoredMember,
  addTestScores,
  allScores,
  type TestGroupOf,
} from "./test-scores";

const inTestDatabase = withTestDatabase();

async function addGroup(db: Database): Promise<TestGroupOf> {
  const programId = await addTestProgram(db, "UJINILAIANGGOTA");
  const id = await addTestGroup(db, programId);
  return { id, programId, by: await addTestAssessor(db, 4011) };
}

const FIRST = new Date("2026-08-01T03:00:00Z");
const SECOND = new Date("2026-09-01T03:00:00Z");
const THIRD = new Date("2026-10-01T03:00:00Z");

describe("readMemberScores", () => {
  it("gives the latest assessment of each member and the one before it", async () => {
    await inTestDatabase(async (db) => {
      const group = await addGroup(db);
      const id = await addTestScoredMember(db, group, "9987650101", null);
      await addTestScores(db, group.by, id, allScores(60), FIRST);
      await addTestScores(db, group.by, id, allScores(90), THIRD);
      await addTestScores(db, group.by, id, allScores(70), SECOND);

      const scores = await readMemberScores(db, [id]);

      expect(scores.get(id)).toEqual({
        latest: allScores(90),
        earlier: allScores(70),
      });
    });
  });

  it("holds each score of a member under a Ringan or Sedang penalty at 70, in the latest assessment and the one before it", async () => {
    await inTestDatabase(async (db) => {
      const group = await addGroup(db);
      const id = await addTestScoredMember(db, group, "9987650105", null);
      await addTestScores(db, group.by, id, allScores(60), FIRST);
      await addTestScores(db, group.by, id, allScores(70), SECOND);
      await addTestScores(db, group.by, id, allScores(90), THIRD);
      const recorder = await addTestRecorder(db);
      await addTestPenaltyOf(db, id, recorder, { category: "light", level: 1 });

      const scores = await readMemberScores(db, [id]);

      expect(scores.get(id)).toEqual({
        latest: allScores(70),
        earlier: allScores(70),
      });
    });
  });

  it("gives no assessment before to a member assessed once", async () => {
    await inTestDatabase(async (db) => {
      const group = await addGroup(db);
      const id = await addTestScoredMember(
        db,
        group,
        "9987650102",
        allScores(80),
      );

      const scores = await readMemberScores(db, [id]);

      expect(scores.get(id)).toEqual({ latest: allScores(80), earlier: null });
    });
  });

  it("leaves out a member not assessed, and every student not asked for", async () => {
    await inTestDatabase(async (db) => {
      const group = await addGroup(db);
      const none = await addTestScoredMember(db, group, "9987650103", null);
      const other = await addTestScoredMember(
        db,
        group,
        "9987650104",
        allScores(80),
      );

      const scores = await readMemberScores(db, [none]);

      expect(scores.size).toBe(0);
      expect(scores.has(other)).toBe(false);
    });
  });
});
