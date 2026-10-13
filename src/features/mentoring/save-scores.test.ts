// Sample NIMs of this file: 9962001000 to 9962001099.
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import {
  NO_PERIOD_TO_SCORE,
  NOT_ALLOWED_TO_SCORE,
  NOT_SCORES,
  SCORED_GROUP_NOT_HELD,
  saveScores,
} from "./save-scores";
import type { ScoresInput } from "./score-input";
import { addTestPeriod, type TestPeriod } from "./test-meetings";
import {
  addTestAccount,
  addTestGroup,
  addTestProgram,
  addTestStudent,
} from "./test-records";
import { testScoreLogOf, testScoresOf } from "./test-scores";

const inTestDatabase = withTestDatabase();

interface Records {
  program: number;
  mentor: AccountForAccess;
  otherMentor: AccountForAccess;
  /** Held the group before the mentor took it. */
  earlierMentor: AccountForAccess;
  groupId: string;
  otherGroupId: string;
  period: TestPeriod;
  /** The two Aktif members of the group. */
  ani: string;
  budi: string;
  /** A member of the group who is on Cuti. */
  onLeave: string;
  /** An Aktif member of the other mentor's group. */
  outsider: string;
}

async function addRecords(db: Database): Promise<Records> {
  const program = await addTestProgram(db, "UJISIMPANNILAI");
  const mentor = await addTestAccount(db, "Pengasuh Uji Simpan Nilai", [
    "mentor",
  ]);
  const otherMentor = await addTestAccount(
    db,
    "Pengasuh Uji Simpan Nilai Lain",
    ["mentor"],
  );
  const earlierMentor = await addTestAccount(
    db,
    "Pengasuh Uji Simpan Nilai Dulu",
    ["mentor"],
  );
  const ani = await addTestStudent(db, program, {
    nim: "9962001001",
    name: "Ani Uji Simpan Nilai",
  });
  const budi = await addTestStudent(db, program, {
    nim: "9962001002",
    name: "Budi Uji Simpan Nilai",
  });
  const onLeave = await addTestStudent(db, program, {
    nim: "9962001003",
    name: "Cuti Uji Simpan Nilai",
    status: "on_leave",
  });
  const outsider = await addTestStudent(db, program, {
    nim: "9962001004",
    name: "Kelompok Lain Uji Simpan Nilai",
  });
  const groupId = await addTestGroup(db, program, {
    number: 1,
    memberIds: [ani, budi, onLeave],
    mentorId: mentor.id,
    earlierMentorId: earlierMentor.id,
  });
  const otherGroupId = await addTestGroup(db, program, {
    number: 2,
    memberIds: [outsider],
    mentorId: otherMentor.id,
  });
  const period = await addTestPeriod(db, 2078);
  return {
    program,
    mentor,
    otherMentor,
    earlierMentor,
    groupId,
    otherGroupId,
    period,
    ani,
    budi,
    onLeave,
    outsider,
  };
}

/** Scores for members of the mentor's group. */
function scoresOf(
  records: Records,
  scores: Record<string, number>,
  more: Partial<ScoresInput> = {},
): ScoresInput {
  return { groupId: records.groupId, scores, ...more };
}

/** The score kept for a student, or null for a student without one. */
async function keptScoreOf(
  db: Database,
  studentId: string,
): Promise<number | null> {
  const [kept] = await testScoresOf(db, studentId);
  return kept?.score ?? null;
}

describe("saveScores", () => {
  it("keeps the score of each member sent, for the running period, as the work of the mentor", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { mentor, period, ani, budi } = records;

      const saved = await saveScores(
        db,
        mentor,
        scoresOf(records, { [ani]: 88, [budi]: 61 }),
        period.day,
      );

      expect(saved).toEqual({ ok: true, value: { savedIds: [ani, budi] } });
      expect(await testScoresOf(db, ani)).toEqual([
        expect.objectContaining({
          periodId: period.id,
          score: 88,
          scoredBy: mentor.id,
        }),
      ]);
      expect(await keptScoreOf(db, budi)).toBe(61);
    });
  });

  it("leaves a member who was not sent without a score", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await saveScores(
        db,
        records.mentor,
        scoresOf(records, { [records.ani]: 88 }),
        records.period.day,
      );

      expect(await keptScoreOf(db, records.budi)).toBeNull();
    });
  });

  it.each([0, 100])("takes the score %i", async (score) => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const saved = await saveScores(
        db,
        records.mentor,
        scoresOf(records, { [records.ani]: score }),
        records.period.day,
      );

      expect(saved.ok).toBe(true);
      expect(await keptScoreOf(db, records.ani)).toBe(score);
    });
  });

  it("writes one log line for the first save: who, with nothing before and the score after", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { mentor, ani } = records;

      await saveScores(
        db,
        mentor,
        scoresOf(records, { [ani]: 88 }),
        records.period.day,
      );

      const lines = await testScoreLogOf(db, ani);
      expect(lines).toHaveLength(1);
      expect(lines[0]).toMatchObject({
        changedBy: mentor.id,
        scoreBefore: null,
        scoreAfter: 88,
      });
      expect(lines[0]?.changedAt).toBeInstanceOf(Date);
    });
  });

  it("puts a new score in the place of a saved one: the student keeps one score for the period", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { mentor, period, ani } = records;
      await saveScores(
        db,
        mentor,
        scoresOf(records, { [ani]: 70 }),
        period.day,
      );

      const saved = await saveScores(
        db,
        mentor,
        scoresOf(records, { [ani]: 85 }),
        period.day,
      );

      expect(saved.ok).toBe(true);
      expect(await testScoresOf(db, ani)).toEqual([
        expect.objectContaining({ score: 85, scoredBy: mentor.id }),
      ]);
    });
  });

  it.each([101, -1, 79.5, Number.NaN])(
    "saves nothing when one score is %d, which is no whole number from 0 to 100",
    async (score) => {
      await inTestDatabase(async (db) => {
        const records = await addRecords(db);
        const { ani, budi } = records;

        const saved = await saveScores(
          db,
          records.mentor,
          scoresOf(records, { [ani]: 88, [budi]: score }),
          records.period.day,
        );

        expect(saved).toEqual(NOT_SCORES);
        expect(await keptScoreOf(db, ani)).toBeNull();
        expect(await keptScoreOf(db, budi)).toBeNull();
      });
    },
  );

  it("saves nothing while no academic period is running", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const beforeEveryPeriod = "1990-01-01";

      const saved = await saveScores(
        db,
        records.mentor,
        scoresOf(records, { [records.ani]: 88 }),
        beforeEveryPeriod,
      );

      expect(saved).toEqual(NO_PERIOD_TO_SCORE);
      expect(await keptScoreOf(db, records.ani)).toBeNull();
    });
  });

  it("is refused to Kepala Unit, who only reads the scores", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const headOfUnit = await addTestAccount(db, "Kepala Unit Uji Nilai", [
        "head_of_unit",
      ]);

      const saved = await saveScores(
        db,
        headOfUnit,
        scoresOf(records, { [records.ani]: 88 }),
        records.period.day,
      );

      expect(saved).toEqual(NOT_ALLOWED_TO_SCORE);
      expect(await keptScoreOf(db, records.ani)).toBeNull();
    });
  });

  it("is refused to a Pengasuh for the group of another mentor", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const saved = await saveScores(
        db,
        records.otherMentor,
        scoresOf(records, { [records.ani]: 88 }),
        records.period.day,
      );

      expect(saved).toEqual(SCORED_GROUP_NOT_HELD);
      expect(await keptScoreOf(db, records.ani)).toBeNull();
    });
  });
});
