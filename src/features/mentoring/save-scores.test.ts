// Sample NIMs of this file: 9962001000 to 9962001099.
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import {
  changedSince,
  NO_PERIOD_TO_SCORE,
  NOT_ALLOWED_TO_SCORE,
  NOT_SCORES,
  SCORED_GROUP_NOT_HELD,
  saveScores,
  scoresChanged,
} from "./save-scores";
import type { ScoresInput } from "./score-input";
import { addTestPeriod, type TestPeriod } from "./test-meetings";
import {
  addTestAccount,
  addTestGroup,
  addTestProgram,
  addTestStudent,
  replaceTestMentor,
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

/**
 * Scores for members of the mentor's group. `openedOn` holds the score
 * the form was opened on, for each student who had one then.
 */
function scoresOf(
  records: Records,
  scores: Record<string, number>,
  openedOn: Record<string, number> = {},
): ScoresInput {
  const basedOn: Record<string, number | null> = {};
  for (const studentId of Object.keys(scores)) {
    basedOn[studentId] = openedOn[studentId] ?? null;
  }
  return { groupId: records.groupId, scores, basedOn };
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
        scoresOf(records, { [ani]: 85 }, { [ani]: 70 }),
        period.day,
      );

      expect(saved.ok).toBe(true);
      expect(await testScoresOf(db, ani)).toEqual([
        expect.objectContaining({ score: 85, scoredBy: mentor.id }),
      ]);
    });
  });

  it("adds a log line for a changed score: who, when, and the score before and after", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { mentor, period, ani } = records;
      await saveScores(
        db,
        mentor,
        scoresOf(records, { [ani]: 70 }),
        period.day,
      );

      await saveScores(
        db,
        mentor,
        scoresOf(records, { [ani]: 85 }, { [ani]: 70 }),
        period.day,
      );

      const lines = await testScoreLogOf(db, ani);
      expect(lines).toHaveLength(2);
      expect(lines.map((line) => [line.scoreBefore, line.scoreAfter])).toEqual(
        expect.arrayContaining([
          [null, 70],
          [70, 85],
        ]),
      );
      for (const line of lines) {
        expect(line.changedBy).toBe(mentor.id);
        expect(line.changedAt).toBeInstanceOf(Date);
      }
    });
  });

  it("names the mentor who holds the group today in the log of a score another mentor gave", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { mentor, otherMentor, period, ani } = records;
      await saveScores(
        db,
        mentor,
        scoresOf(records, { [ani]: 70 }),
        period.day,
      );
      await replaceTestMentor(db, records.groupId, otherMentor.id, period.day);

      const saved = await saveScores(
        db,
        otherMentor,
        scoresOf(records, { [ani]: 60 }, { [ani]: 70 }),
        period.day,
      );

      expect(saved.ok).toBe(true);
      expect(await testScoreLogOf(db, ani)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            changedBy: otherMentor.id,
            scoreBefore: 70,
            scoreAfter: 60,
          }),
        ]),
      );
    });
  });

  it("writes nothing for a score that is the one kept: no log line, and the day it was given stays", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { mentor, otherMentor, period, ani } = records;
      await saveScores(
        db,
        mentor,
        scoresOf(records, { [ani]: 70 }),
        period.day,
      );
      await replaceTestMentor(db, records.groupId, otherMentor.id, period.day);

      const saved = await saveScores(
        db,
        otherMentor,
        scoresOf(records, { [ani]: 70 }, { [ani]: 70 }),
        period.day,
      );

      expect(saved.ok).toBe(true);
      expect(await testScoreLogOf(db, ani)).toHaveLength(1);
      expect(await testScoresOf(db, ani)).toEqual([
        expect.objectContaining({ score: 70, scoredBy: mentor.id }),
      ]);
    });
  });

  it("tells a second window its score changed, with the students it changed for, and keeps the score of the first", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { mentor, period, ani, budi } = records;
      await saveScores(
        db,
        mentor,
        scoresOf(records, { [ani]: 70 }),
        period.day,
      );
      const fromFirstWindow = scoresOf(records, { [ani]: 85 }, { [ani]: 70 });
      const fromSecondWindow = scoresOf(
        records,
        { [ani]: 60, [budi]: 90 },
        { [ani]: 70 },
      );
      await saveScores(db, mentor, fromFirstWindow, period.day);

      const saved = await saveScores(db, mentor, fromSecondWindow, period.day);

      expect(saved).toEqual(scoresChanged([ani]));
      expect(await keptScoreOf(db, ani)).toBe(85);
      expect(await keptScoreOf(db, budi)).toBeNull();
      expect(await testScoreLogOf(db, ani)).toHaveLength(2);
    });
  });

  it("tells a second window that gives a first score that the student has one already", async () => {
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
        scoresOf(records, { [ani]: 95 }),
        period.day,
      );

      expect(saved).toEqual(scoresChanged([ani]));
      expect(await testScoresOf(db, ani)).toEqual([
        expect.objectContaining({ score: 70 }),
      ]);
    });
  });
});

describe("changedSince", () => {
  it("finds nobody while every score kept is the one the form was opened on", () => {
    const kept = new Map([["ani", 70]]);

    expect(changedSince({ ani: 70, budi: null }, kept)).toEqual([]);
  });

  it("finds a student whose score is another now, one who got a first score, and one whose box was opened on a score that is not kept", () => {
    const kept = new Map([
      ["ani", 85],
      ["budi", 60],
    ]);

    expect(changedSince({ ani: 70, budi: null, cici: 50 }, kept)).toEqual([
      "ani",
      "budi",
      "cici",
    ]);
  });
});

describe("saveScores refused", () => {
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
