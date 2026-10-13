import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { mentorGroupMentors } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import type { EvaluationScores } from "./evaluation-aspects";
import { evaluationResult } from "./evaluation-result";
import {
  countPoorGroups,
  readLastGroupEvaluations,
  readLastMentorEvaluations,
} from "./last-evaluations";
import {
  addTestEvaluation,
  addTestEvaluator,
  addTestHeldGroup,
  addTestPeriods,
  TEST_SCORES,
} from "./test-evaluations";
import {
  addTestEndedGroup,
  addTestGroup,
  addTestMentor,
  addTestMentorLine,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const YEAR = 2081;
const PROGRAM = "UJITERAKHIR";

function onlyPrograms(studyProgramIds: number[]): RowLimit {
  return { kind: "some", studyProgramIds, menteesOf: [], studentIds: [] };
}

/** Four values that all are the same, so their average is that value. */
function all(value: number): EvaluationScores {
  return {
    activity: value,
    attendance: value,
    achievement: value,
    feedback: value,
  };
}

async function addRecords(db: Database) {
  const held = await addTestHeldGroup(db, PROGRAM, "Pengasuh Uji Terakhir");
  const periods = await addTestPeriods(db, YEAR);
  const head = await addTestEvaluator(db, ["head_of_unit"], "Kepala Terakhir");
  const limit = onlyPrograms([held.studyProgramId]);
  return { held, periods, head, limit, by: { ...held, evaluatedBy: head.id } };
}

/** Ends the mentor line of today of a group and gives the group a new mentor. */
async function replaceMentor(db: Database, groupId: string): Promise<string> {
  await db
    .update(mentorGroupMentors)
    .set({ endsOn: "2026-12-31", endReason: "Mutasi" })
    .where(eq(mentorGroupMentors.groupId, groupId));
  const nextId = await addTestMentor(db, { name: "Pengasuh Uji Pengganti" });
  await addTestMentorLine(db, groupId, nextId, { startsOn: "2027-01-01" });
  return nextId;
}

describe("readLastGroupEvaluations", () => {
  it("gives the evaluation of the latest period, whichever was saved last", async () => {
    await inTestDatabase(async (db) => {
      const { held, periods, limit, by } = await addRecords(db);
      await addTestEvaluation(db, {
        ...by,
        ...all(90),
        periodId: periods.runningId,
        evaluatedAt: new Date("2082-10-01T03:00:00Z"),
      });
      await addTestEvaluation(db, {
        ...by,
        ...all(50),
        periodId: periods.beforeId,
        evaluatedAt: new Date("2082-10-05T03:00:00Z"),
      });

      const last = await readLastGroupEvaluations(db, limit, [held.groupId]);

      expect(last.get(held.groupId)).toEqual(all(90));
    });
  });

  it("gives nothing for a group without an evaluation, and for no groups", async () => {
    await inTestDatabase(async (db) => {
      const { held, limit } = await addRecords(db);

      expect(await readLastGroupEvaluations(db, limit, [held.groupId])).toEqual(
        new Map(),
      );
      expect(await readLastGroupEvaluations(db, limit, [])).toEqual(new Map());
    });
  });

  it("gives nothing once the group has another mentor: the evaluation was of the earlier one", async () => {
    await inTestDatabase(async (db) => {
      const { held, periods, limit, by } = await addRecords(db);
      await addTestEvaluation(db, { ...by, periodId: periods.runningId });
      await replaceMentor(db, held.groupId);

      const last = await readLastGroupEvaluations(db, limit, [held.groupId]);

      expect(last.size).toBe(0);
    });
  });

  it("gives nothing of a group outside the limit", async () => {
    await inTestDatabase(async (db) => {
      const { held, periods, by } = await addRecords(db);
      await addTestEvaluation(db, { ...by, periodId: periods.runningId });

      const none = await readLastGroupEvaluations(db, onlyPrograms([]), [
        held.groupId,
      ]);

      expect(none.size).toBe(0);
    });
  });

  it("reads many groups at once", async () => {
    await inTestDatabase(async (db) => {
      const { held, periods, limit, by } = await addRecords(db);
      const secondId = await addTestGroup(db, held.studyProgramId, {
        number: 2,
      });
      await addTestMentorLine(db, secondId, held.mentorId);
      await addTestEvaluation(db, { ...by, periodId: periods.runningId });
      await addTestEvaluation(db, {
        ...by,
        ...all(60),
        groupId: secondId,
        periodId: periods.beforeId,
      });

      const last = await readLastGroupEvaluations(db, limit, [
        held.groupId,
        secondId,
      ]);

      expect(last.get(held.groupId)).toEqual(TEST_SCORES);
      expect(last.get(secondId)).toEqual(all(60));
    });
  });
});

describe("readLastMentorEvaluations", () => {
  it("gives the evaluation of the latest period, over every group of the mentor", async () => {
    await inTestDatabase(async (db) => {
      const { held, periods, limit, by } = await addRecords(db);
      const secondId = await addTestGroup(db, held.studyProgramId, {
        number: 2,
      });
      await addTestEvaluation(db, {
        ...by,
        ...all(50),
        periodId: periods.beforeId,
      });
      await addTestEvaluation(db, {
        ...by,
        ...all(90),
        groupId: secondId,
        periodId: periods.runningId,
      });

      const last = await readLastMentorEvaluations(db, limit, [held.mentorId]);

      expect(last.get(held.mentorId)).toEqual(all(90));
    });
  });

  it("takes the one saved last among the evaluations of one period", async () => {
    await inTestDatabase(async (db) => {
      const { held, periods, limit, by } = await addRecords(db);
      const secondId = await addTestGroup(db, held.studyProgramId, {
        number: 2,
      });
      await addTestEvaluation(db, {
        ...by,
        ...all(70),
        periodId: periods.runningId,
        evaluatedAt: new Date("2082-10-05T03:00:00Z"),
      });
      await addTestEvaluation(db, {
        ...by,
        ...all(40),
        groupId: secondId,
        periodId: periods.runningId,
        evaluatedAt: new Date("2082-10-01T03:00:00Z"),
      });

      const last = await readLastMentorEvaluations(db, limit, [held.mentorId]);

      expect(last.get(held.mentorId)).toEqual(all(70));
    });
  });

  it("keeps the evaluation of a mentor who has left the group, and gives the new mentor none", async () => {
    await inTestDatabase(async (db) => {
      const { held, periods, limit, by } = await addRecords(db);
      await addTestEvaluation(db, { ...by, periodId: periods.runningId });
      const nextId = await replaceMentor(db, held.groupId);

      const last = await readLastMentorEvaluations(db, limit, [
        held.mentorId,
        nextId,
      ]);

      expect(last.get(held.mentorId)).toEqual(TEST_SCORES);
      expect(last.has(nextId)).toBe(false);
    });
  });

  it("leaves out an evaluation of a group outside the limit, or of an ended group", async () => {
    await inTestDatabase(async (db) => {
      const { held, periods, limit, by } = await addRecords(db);
      const endedId = await addTestEndedGroup(db, held.studyProgramId, {
        number: 2,
      });
      const other = await addTestHeldGroup(db, "UJITERAKHIRLAIN", "Lain");
      await addTestEvaluation(db, {
        ...by,
        groupId: endedId,
        periodId: periods.runningId,
      });
      await addTestEvaluation(db, {
        ...by,
        groupId: other.groupId,
        periodId: periods.runningId,
      });

      const last = await readLastMentorEvaluations(db, limit, [held.mentorId]);

      expect(last.size).toBe(0);
      expect(await readLastMentorEvaluations(db, limit, [])).toEqual(new Map());
    });
  });
});

describe("countPoorGroups", () => {
  it("counts the groups whose last evaluation is Kurang, not those that were Kurang before", async () => {
    await inTestDatabase(async (db) => {
      const { held, periods, limit, by } = await addRecords(db);
      const program = held.studyProgramId;
      const poorId = await addTestGroup(db, program, { number: 2 });
      const betterId = await addTestGroup(db, program, { number: 3 });
      await addTestGroup(db, program, { number: 4 });
      for (const groupId of [poorId, betterId]) {
        await addTestMentorLine(db, groupId, held.mentorId);
      }
      const running = { ...by, periodId: periods.runningId };
      const before = { ...by, periodId: periods.beforeId };
      await addTestEvaluation(db, { ...running, ...all(90) });
      await addTestEvaluation(db, { ...before, ...all(90), groupId: poorId });
      await addTestEvaluation(db, { ...running, ...all(64), groupId: poorId });
      await addTestEvaluation(db, { ...before, ...all(10), groupId: betterId });
      await addTestEvaluation(db, {
        ...running,
        ...all(65),
        groupId: betterId,
      });

      expect(await countPoorGroups(db, limit)).toBe(1);
    });
  });

  it("draws the line where the result does: a total of 259 is Kurang and 260 is not", async () => {
    await inTestDatabase(async (db) => {
      const { held, periods, limit, by } = await addRecords(db);
      const edgeId = await addTestGroup(db, held.studyProgramId, { number: 2 });
      await addTestMentorLine(db, edgeId, held.mentorId);
      const below = { ...all(65), feedback: 64 };
      const running = { ...by, periodId: periods.runningId };
      await addTestEvaluation(db, { ...running, ...below });
      await addTestEvaluation(db, { ...running, ...all(65), groupId: edgeId });

      expect(evaluationResult(below)).toBe("poor");
      expect(evaluationResult(all(65))).toBe("fair");
      expect(await countPoorGroups(db, limit)).toBe(1);
    });
  });

  it("counts no group of an earlier mentor, none outside the limit and none that is ended", async () => {
    await inTestDatabase(async (db) => {
      const { held, periods, limit, by } = await addRecords(db);
      const endedId = await addTestEndedGroup(db, held.studyProgramId, {
        number: 2,
      });
      await addTestMentorLine(db, endedId, held.mentorId);
      const poor = { ...by, ...all(10), periodId: periods.runningId };
      await addTestEvaluation(db, poor);
      await addTestEvaluation(db, { ...poor, groupId: endedId });

      expect(await countPoorGroups(db, limit)).toBe(1);
      expect(await countPoorGroups(db, onlyPrograms([]))).toBe(0);

      await replaceMentor(db, held.groupId);
      expect(await countPoorGroups(db, limit)).toBe(0);
    });
  });
});
