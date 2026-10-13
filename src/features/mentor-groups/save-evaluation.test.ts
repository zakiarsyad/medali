import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { mentorGroupMentors } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import type { EvaluationInput } from "./evaluation-input";
import {
  GROUP_NOT_FOUND,
  GROUP_WITHOUT_MENTOR,
  NOT_ALLOWED_TO_EVALUATE,
  NOT_HELD_THEN,
  OF_EARLIER_MENTOR,
  PERIOD_NOT_OFFERED,
  saveEvaluation,
} from "./save-evaluation";
import {
  addTestEvaluator,
  addTestHeldGroup,
  addTestPeriods,
  TEST_SCORES,
  testEvaluationsOf,
  testLogOf,
} from "./test-evaluations";
import {
  addTestEndedGroup,
  addTestGroup,
  addTestMentor,
  addTestMentorLine,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const YEAR = 2071;
const PROGRAM = "UJISIMPANEVAL";
const MENTOR = "Pengasuh Uji Simpan";

/** A held group, the periods, and what Kepala Unit sends for the running one. */
async function addGroupToEvaluate(db: Database) {
  const group = await addTestHeldGroup(db, PROGRAM, MENTOR);
  const periods = await addTestPeriods(db, YEAR);
  const input: EvaluationInput = {
    groupId: group.groupId,
    periodId: periods.runningId,
    scores: TEST_SCORES,
    note: "Rutin mendampingi.",
  };
  return { ...group, periods, input };
}

describe("saveEvaluation", () => {
  it("keeps the group, its mentor of today, the period, the values, the note, who saved and when", async () => {
    await inTestDatabase(async (db) => {
      const { input, periods, groupId, mentorId } =
        await addGroupToEvaluate(db);
      const head = await addTestEvaluator(db, ["head_of_unit"]);

      const saved = await saveEvaluation(db, head, input, periods.day);

      expect(saved).toEqual({
        ok: true,
        value: { mentorName: MENTOR, result: "fair" },
      });
      const stored = await testEvaluationsOf(db, groupId);
      expect(stored).toHaveLength(1);
      expect(stored[0]).toMatchObject({
        groupId,
        mentorId,
        periodId: periods.runningId,
        ...TEST_SCORES,
        note: "Rutin mendampingi.",
        evaluatedBy: head.id,
      });
      expect(stored[0]?.evaluatedAt).toBeInstanceOf(Date);
    });
  });

  it("adds a first log line with who saved and the values after, and none before", async () => {
    await inTestDatabase(async (db) => {
      const { input, periods, groupId } = await addGroupToEvaluate(db);
      const head = await addTestEvaluator(db, ["head_of_unit"]);

      await saveEvaluation(db, head, input, periods.day);

      const log = await testLogOf(db, groupId);
      expect(log).toHaveLength(1);
      expect(log[0]?.line).toMatchObject({
        changedBy: head.id,
        activityBefore: null,
        attendanceBefore: null,
        achievementBefore: null,
        feedbackBefore: null,
        noteBefore: null,
        activityAfter: 80,
        attendanceAfter: 75,
        achievementAfter: 70,
        feedbackAfter: 85,
        noteAfter: "Rutin mendampingi.",
      });
    });
  });

  it.each([
    "upk_staff",
    "director",
    "head_of_program",
    "mentor",
    "student",
  ] as const)("refuses %s, and saves nothing", async (role) => {
    await inTestDatabase(async (db) => {
      const { input, periods, groupId, studyProgramId } =
        await addGroupToEvaluate(db);
      const other = await addTestEvaluator(
        db,
        [role],
        "Akun Uji Tanpa Hak",
        studyProgramId,
      );

      const saved = await saveEvaluation(db, other, input, periods.day);

      expect(saved).toEqual(NOT_ALLOWED_TO_EVALUATE);
      expect(await testEvaluationsOf(db, groupId)).toEqual([]);
      expect(await testLogOf(db, groupId)).toEqual([]);
    });
  });

  it("lets an account that is Kepala Unit and also another role evaluate", async () => {
    await inTestDatabase(async (db) => {
      const { input, periods } = await addGroupToEvaluate(db);
      const both = await addTestEvaluator(db, [
        "head_of_program",
        "head_of_unit",
      ]);

      const saved = await saveEvaluation(db, both, input, periods.day);

      expect(saved.ok).toBe(true);
    });
  });

  it("corrects the evaluation of the same group and period, and logs the values before and after", async () => {
    await inTestDatabase(async (db) => {
      const { input, periods, groupId, mentorId } =
        await addGroupToEvaluate(db);
      const head = await addTestEvaluator(db, ["head_of_unit"]);
      const second = await addTestEvaluator(db, ["head_of_unit"], "Kepala Dua");
      await saveEvaluation(db, head, input, periods.day);

      const corrected = await saveEvaluation(
        db,
        second,
        {
          ...input,
          scores: { ...TEST_SCORES, activity: 50, feedback: 40 },
          note: null,
        },
        periods.day,
      );

      expect(corrected).toEqual({
        ok: true,
        value: { mentorName: MENTOR, result: "poor" },
      });
      const stored = await testEvaluationsOf(db, groupId);
      expect(stored).toHaveLength(1);
      expect(stored[0]).toMatchObject({
        mentorId,
        activity: 50,
        attendance: 75,
        achievement: 70,
        feedback: 40,
        note: null,
        evaluatedBy: second.id,
      });
      const log = await testLogOf(db, groupId);
      expect(log).toHaveLength(2);
      expect(log[1]?.line).toMatchObject({
        changedBy: second.id,
        activityBefore: 80,
        attendanceBefore: 75,
        achievementBefore: 70,
        feedbackBefore: 85,
        noteBefore: "Rutin mendampingi.",
        activityAfter: 50,
        attendanceAfter: 75,
        achievementAfter: 70,
        feedbackAfter: 40,
        noteAfter: null,
      });
    });
  });

  it("writes nothing when the same values are saved again: one evaluation, one log line, the first evaluator", async () => {
    await inTestDatabase(async (db) => {
      const { input, periods, groupId } = await addGroupToEvaluate(db);
      const head = await addTestEvaluator(db, ["head_of_unit"]);
      const second = await addTestEvaluator(db, ["head_of_unit"], "Kepala Dua");
      await saveEvaluation(db, head, input, periods.day);
      const [first] = await testEvaluationsOf(db, groupId);

      const again = await saveEvaluation(db, second, input, periods.day);

      expect(again).toEqual({
        ok: true,
        value: { mentorName: MENTOR, result: "fair" },
      });
      expect(await testEvaluationsOf(db, groupId)).toEqual([first]);
      expect(await testLogOf(db, groupId)).toHaveLength(1);
    });
  });

  it("keeps one evaluation for the running period and one for the period before", async () => {
    await inTestDatabase(async (db) => {
      const { input, periods, groupId } = await addGroupToEvaluate(db);
      const head = await addTestEvaluator(db, ["head_of_unit"]);
      await saveEvaluation(db, head, input, periods.day);

      const before = { ...input, periodId: periods.beforeId };
      const saved = await saveEvaluation(db, head, before, periods.day);

      expect(saved.ok).toBe(true);
      const stored = await testEvaluationsOf(db, groupId);
      expect(stored.map((evaluation) => evaluation.periodId).sort()).toEqual(
        [periods.runningId, periods.beforeId].sort(),
      );
    });
  });

  it("refuses an older period, one that has not started, and one that does not exist", async () => {
    await inTestDatabase(async (db) => {
      const { input, periods, groupId } = await addGroupToEvaluate(db);
      const head = await addTestEvaluator(db, ["head_of_unit"]);
      const unknown = "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f4a02";

      for (const periodId of [periods.olderId, periods.laterId, unknown]) {
        const saved = await saveEvaluation(
          db,
          head,
          { ...input, periodId },
          periods.day,
        );
        expect(saved).toEqual(PERIOD_NOT_OFFERED);
      }
      expect(await testEvaluationsOf(db, groupId)).toEqual([]);
    });
  });

  it("refuses a group that is ended, and one that does not exist", async () => {
    await inTestDatabase(async (db) => {
      const { input, periods, studyProgramId } = await addGroupToEvaluate(db);
      const head = await addTestEvaluator(db, ["head_of_unit"]);
      const endedId = await addTestEndedGroup(db, studyProgramId, {
        number: 2,
      });
      const mentorId = await addTestMentor(db, { name: "Pengasuh Uji Usai" });
      await addTestMentorLine(db, endedId, mentorId);
      const unknown = "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f4a01";

      for (const groupId of [endedId, unknown]) {
        const saved = await saveEvaluation(
          db,
          head,
          { ...input, groupId },
          periods.day,
        );
        expect(saved).toEqual(GROUP_NOT_FOUND);
      }
      expect(await testEvaluationsOf(db, endedId)).toEqual([]);
    });
  });

  it("refuses a group that has no mentor today", async () => {
    await inTestDatabase(async (db) => {
      const { input, periods, studyProgramId } = await addGroupToEvaluate(db);
      const head = await addTestEvaluator(db, ["head_of_unit"]);
      const bareId = await addTestGroup(db, studyProgramId, { number: 3 });
      const pastId = await addTestGroup(db, studyProgramId, { number: 4 });
      const mentorId = await addTestMentor(db, { name: "Pengasuh Uji Lalu" });
      await addTestMentorLine(db, pastId, mentorId, {
        endsOn: "2026-12-31",
        endReason: "Mutasi",
      });

      for (const groupId of [bareId, pastId]) {
        const saved = await saveEvaluation(
          db,
          head,
          { ...input, groupId },
          periods.day,
        );
        expect(saved).toEqual(GROUP_WITHOUT_MENTOR);
      }
    });
  });

  it("refuses to correct an evaluation once the group has another mentor, and leaves it as it was", async () => {
    await inTestDatabase(async (db) => {
      const { input, periods, groupId, mentorId } =
        await addGroupToEvaluate(db);
      const head = await addTestEvaluator(db, ["head_of_unit"]);
      await saveEvaluation(db, head, input, periods.day);
      await db
        .update(mentorGroupMentors)
        .set({ endsOn: "2026-12-31", endReason: "Mutasi" })
        .where(eq(mentorGroupMentors.groupId, groupId));
      const nextId = await addTestMentor(db, { name: "Pengasuh Uji Baru" });
      await addTestMentorLine(db, groupId, nextId, { startsOn: "2027-01-01" });

      const corrected = await saveEvaluation(
        db,
        head,
        { ...input, scores: { ...TEST_SCORES, activity: 10 } },
        periods.day,
      );

      expect(corrected).toEqual(OF_EARLIER_MENTOR);
      const stored = await testEvaluationsOf(db, groupId);
      expect(stored).toHaveLength(1);
      expect(stored[0]).toMatchObject({ mentorId, activity: 80 });
      expect(await testLogOf(db, groupId)).toHaveLength(1);
    });
  });

  /** A second group of the program, whose mentor took it on a day. */
  async function addGroupHeldSince(
    db: Database,
    studyProgramId: number,
    startsOn: string,
  ): Promise<string> {
    const groupId = await addTestGroup(db, studyProgramId, { number: 5 });
    const mentorId = await addTestMentor(db, { name: "Pengasuh Uji Baru" });
    await addTestMentorLine(db, groupId, mentorId, { startsOn });
    return groupId;
  }

  it("refuses the period before for a mentor who took the group in the running period, and takes the running one", async () => {
    await inTestDatabase(async (db) => {
      const { input, periods, studyProgramId } = await addGroupToEvaluate(db);
      const head = await addTestEvaluator(db, ["head_of_unit"]);
      const groupId = await addGroupHeldSince(
        db,
        studyProgramId,
        `${YEAR + 1}-09-01`,
      );

      const before = await saveEvaluation(
        db,
        head,
        { ...input, groupId, periodId: periods.beforeId },
        periods.day,
      );

      expect(before).toEqual(NOT_HELD_THEN);
      expect(await testEvaluationsOf(db, groupId)).toEqual([]);
      expect(await testLogOf(db, groupId)).toEqual([]);

      const running = await saveEvaluation(
        db,
        head,
        { ...input, groupId },
        periods.day,
      );
      expect(running.ok).toBe(true);
    });
  });

  it("takes the period before for a mentor who took the group inside it, on its last day too", async () => {
    await inTestDatabase(async (db) => {
      const { input, periods, studyProgramId } = await addGroupToEvaluate(db);
      const head = await addTestEvaluator(db, ["head_of_unit"]);
      const groupId = await addGroupHeldSince(
        db,
        studyProgramId,
        `${YEAR + 1}-07-31`,
      );

      const before = await saveEvaluation(
        db,
        head,
        { ...input, groupId, periodId: periods.beforeId },
        periods.day,
      );

      expect(before.ok).toBe(true);
      expect(await testEvaluationsOf(db, groupId)).toHaveLength(1);
    });
  });
});
