// Sample Tahun akademik of this file: 4011 to 4011.
// Sample NIMs of this file: 9987650100 to 9987650199.
import { inArray } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestPenaltyOf,
  addTestRecorder,
} from "@/discipline-penalties/test-penalties";
import { readMemberScores, readScoreSums } from "./member-scores";
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

describe("readScoreSums", () => {
  it("sums the latest scores and their change by total, for the Aktif students named, with a limit held at 70", async () => {
    await inTestDatabase(async (db) => {
      const group = await addGroup(db);
      const rising = await addTestScoredMember(db, group, "9987650110", null);
      await addTestScores(db, group.by, rising, allScores(60), FIRST);
      await addTestScores(db, group.by, rising, allScores(90), SECOND);
      const once = await addTestScoredMember(
        db,
        group,
        "9987650111",
        allScores(80),
      );
      const onLeave = await addTestScoredMember(
        db,
        group,
        "9987650112",
        allScores(50),
        { status: "on_leave" },
      );
      const limited = await addTestScoredMember(db, group, "9987650113", null);
      await addTestScores(db, group.by, limited, allScores(70), FIRST);
      await addTestScores(db, group.by, limited, allScores(90), SECOND);
      const recorder = await addTestRecorder(db);
      await addTestPenaltyOf(db, limited, recorder, {
        category: "light",
        level: 1,
      });
      await addTestScoredMember(db, group, "9987650114", allScores(40));
      const named = [rising, once, onLeave, limited];

      const sums = await readScoreSums(db, inArray(students.id, named));

      const byTotal = [...sums].sort((one, other) => one.total - other.total);
      expect(byTotal).toEqual([
        {
          total: 420,
          students: 1,
          latest: allScores(70),
          changed: 1,
          change: allScores(0),
        },
        {
          total: 480,
          students: 1,
          latest: allScores(80),
          changed: 0,
          change: allScores(0),
        },
        {
          total: 540,
          students: 1,
          latest: allScores(90),
          changed: 1,
          change: allScores(30),
        },
      ]);
    });
  });

  it("puts the students who share a total in one sum", async () => {
    await inTestDatabase(async (db) => {
      const group = await addGroup(db);
      const named: string[] = [];
      for (const nim of ["9987650120", "9987650121", "9987650122"]) {
        named.push(await addTestScoredMember(db, group, nim, allScores(75)));
      }

      const sums = await readScoreSums(db, inArray(students.id, named));

      expect(sums).toEqual([
        {
          total: 450,
          students: 3,
          latest: allScores(225),
          changed: 0,
          change: allScores(0),
        },
      ]);
    });
  });
});
