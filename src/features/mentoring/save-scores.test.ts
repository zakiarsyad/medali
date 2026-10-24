// Sample Tahun akademik of this file: 2680 to 2680.
// Sample NIMs of this file: 9962001000 to 9962001099.
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import { ROLE_IDS } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { mentorGroups } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { STARTING_INDICATORS } from "@/mentoring/score-indicators";
import { readIndicators } from "./indicator-set";
import { STARTING_INDICATORS_VERSION } from "./indicator-version";
import { saveIndicators } from "./save-indicators";
import {
  changedSince,
  NO_PERIOD_TO_SCORE,
  NOT_ALLOWED_TO_SCORE,
  NOT_MEMBERS_TO_SCORE,
  NOT_SCORES,
  NOT_SIX_SCORES,
  SCORE_INDICATORS_CHANGED,
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
import { addTestScore, testScoreLogOf, testScoresOf } from "./test-scores";

const inTestDatabase = withTestDatabase();

const OTHER_ROLES = ROLE_IDS.filter((role) => role !== "mentor");

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
  const period = await addTestPeriod(db, 2680);
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

/** Six indicator scores, by the final score they give. */
const S20 = [1, 1, 1, 1, 1, 1];
const S60 = [3, 3, 3, 3, 3, 3];
const S70 = [4, 4, 3, 3, 4, 3];
const S80 = [4, 4, 4, 4, 4, 4];
const S83 = [4, 5, 4, 3, 5, 4];
const S87 = [5, 5, 4, 4, 4, 4];
const S90 = [5, 5, 4, 4, 5, 4];
const S100 = [5, 5, 5, 5, 5, 5];

const STARTING_NAMES = STARTING_INDICATORS.map((indicator) => indicator.name);

/**
 * Six scores for each of some members of the mentor's group. `openedOn`
 * holds the six scores the form was opened on, for each student who had
 * them then.
 */
function scoresOf(
  records: Records,
  scores: Record<string, number[]>,
  openedOn: Record<string, number[]> = {},
): ScoresInput {
  const basedOn: Record<string, string> = {};
  for (const studentId of Object.keys(scores)) {
    const before = openedOn[studentId];
    basedOn[studentId] = before ? before.join(",") : "";
  }
  return {
    groupId: records.groupId,
    indicatorsVersion: STARTING_INDICATORS_VERSION,
    scores,
    basedOn,
  };
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
        scoresOf(records, { [ani]: S90, [budi]: S60 }),
        period.day,
      );

      expect(saved).toEqual({ ok: true, value: { savedIds: [ani, budi] } });
      expect(await testScoresOf(db, ani)).toEqual([
        expect.objectContaining({
          periodId: period.id,
          score: 90,
          indicatorScores: S90,
          indicatorNames: STARTING_NAMES,
          scoredBy: mentor.id,
        }),
      ]);
      expect(await keptScoreOf(db, budi)).toBe(60);
    });
  });

  it("leaves a member who was not sent without a score", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await saveScores(
        db,
        records.mentor,
        scoresOf(records, { [records.ani]: S90 }),
        records.period.day,
      );

      expect(await keptScoreOf(db, records.budi)).toBeNull();
    });
  });

  it.each([
    [S20, 20],
    [S83, 83.3],
    [S100, 100],
  ])("takes the six scores %j, which give %d", async (six, score) => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const saved = await saveScores(
        db,
        records.mentor,
        scoresOf(records, { [records.ani]: six }),
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
        scoresOf(records, { [ani]: S90 }),
        records.period.day,
      );

      const lines = await testScoreLogOf(db, ani);
      expect(lines).toHaveLength(1);
      expect(lines[0]).toMatchObject({
        changedBy: mentor.id,
        scoreBefore: null,
        scoreAfter: 90,
        indicatorScoresBefore: null,
        indicatorNamesBefore: null,
        indicatorScoresAfter: S90,
        indicatorNamesAfter: STARTING_NAMES,
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
        scoresOf(records, { [ani]: S70 }),
        period.day,
      );

      const saved = await saveScores(
        db,
        mentor,
        scoresOf(records, { [ani]: S87 }, { [ani]: S70 }),
        period.day,
      );

      expect(saved.ok).toBe(true);
      expect(await testScoresOf(db, ani)).toEqual([
        expect.objectContaining({ score: 86.7, scoredBy: mentor.id }),
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
        scoresOf(records, { [ani]: S70 }),
        period.day,
      );

      await saveScores(
        db,
        mentor,
        scoresOf(records, { [ani]: S87 }, { [ani]: S70 }),
        period.day,
      );

      const lines = await testScoreLogOf(db, ani);
      expect(lines).toHaveLength(2);
      expect(lines.map((line) => [line.scoreBefore, line.scoreAfter])).toEqual(
        expect.arrayContaining([
          [null, 70],
          [70, 86.7],
        ]),
      );
      for (const line of lines) {
        expect(line.changedBy).toBe(mentor.id);
        expect(line.changedAt).toBeInstanceOf(Date);
      }
    });
  });

  it("keeps the names the scores were given with when Kepala Unit changes the indicators after, and gives new scores the new names", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { mentor, period, ani, budi } = records;
      await saveScores(
        db,
        mentor,
        scoresOf(records, { [ani]: S83 }),
        period.day,
      );
      const kepala = await addTestAccount(db, "Kepala Uji Simpan Nilai", [
        "head_of_unit",
      ]);
      const renamed = STARTING_INDICATORS.map((indicator, place) =>
        place === 0 ? { ...indicator, name: "Kemandirian" } : indicator,
      );
      const { version } = await readIndicators(db);
      await saveIndicators(db, kepala, renamed, version);
      const reloaded = await readIndicators(db);

      await saveScores(
        db,
        mentor,
        {
          ...scoresOf(records, { [budi]: S80 }),
          indicatorsVersion: reloaded.version,
        },
        period.day,
      );

      const [aniScore] = await testScoresOf(db, ani);
      const [budiScore] = await testScoresOf(db, budi);
      expect(aniScore?.indicatorNames).toEqual(STARTING_NAMES);
      expect(budiScore?.indicatorNames).toEqual(
        renamed.map((indicator) => indicator.name),
      );
    });
  });

  it("refuses the whole save of a form opened before Kepala Unit changed the indicators, keeping nothing, so no score lands under another indicator", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { mentor, period, ani, budi } = records;
      const openedOn = await readIndicators(db);
      const kepala = await addTestAccount(db, "Kepala Uji Ganti Indikator", [
        "head_of_unit",
      ]);
      const swapped = STARTING_INDICATORS.map((indicator, place) =>
        place === 2 ? { ...indicator, name: "Ketertiban" } : indicator,
      );
      await saveIndicators(db, kepala, swapped, openedOn.version);

      const saved = await saveScores(
        db,
        mentor,
        {
          ...scoresOf(records, { [ani]: S83, [budi]: S80 }),
          indicatorsVersion: openedOn.version,
        },
        period.day,
      );

      expect(saved).toEqual({
        ok: false,
        error:
          "Indikator penilaian sudah diubah oleh Kepala Uji Ganti Indikator. Muat ulang.",
      });
      expect(await keptScoreOf(db, ani)).toBeNull();
      expect(await keptScoreOf(db, budi)).toBeNull();
      expect(await testScoreLogOf(db, ani)).toEqual([]);
    });
  });

  it("refuses a form that names indicators that are no setting", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const saved = await saveScores(
        db,
        records.mentor,
        {
          ...scoresOf(records, { [records.ani]: S83 }),
          indicatorsVersion: randomUUID(),
        },
        records.period.day,
      );

      expect(saved).toEqual(SCORE_INDICATORS_CHANGED);
      expect(await keptScoreOf(db, records.ani)).toBeNull();
    });
  });

  it("puts six indicator scores in the place of a score given before the indicators, and logs both", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { mentor, period, ani } = records;
      await addTestScore(db, {
        studentId: ani,
        periodId: period.id,
        score: 80,
        scoredBy: records.earlierMentor.id,
      });

      const saved = await saveScores(
        db,
        mentor,
        {
          groupId: records.groupId,
          scores: { [ani]: S83 },
          indicatorsVersion: STARTING_INDICATORS_VERSION,
          basedOn: { [ani]: "80" },
        },
        period.day,
      );

      expect(saved.ok).toBe(true);
      expect(await testScoresOf(db, ani)).toEqual([
        expect.objectContaining({
          score: 83.3,
          indicatorScores: S83,
          indicatorNames: STARTING_NAMES,
          scoredBy: mentor.id,
        }),
      ]);
      expect(await testScoreLogOf(db, ani)).toEqual([
        expect.objectContaining({
          changedBy: mentor.id,
          scoreBefore: 80,
          scoreAfter: 83.3,
          indicatorScoresBefore: null,
          indicatorNamesBefore: null,
          indicatorScoresAfter: S83,
          indicatorNamesAfter: STARTING_NAMES,
        }),
      ]);
    });
  });

  it("logs the six scores and their names before and after a change", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { mentor, period, ani } = records;
      await saveScores(
        db,
        mentor,
        scoresOf(records, { [ani]: S70 }),
        period.day,
      );

      await saveScores(
        db,
        mentor,
        scoresOf(records, { [ani]: S83 }, { [ani]: S70 }),
        period.day,
      );

      const lines = await testScoreLogOf(db, ani);
      expect(lines.find((line) => line.scoreBefore === 70)).toMatchObject({
        scoreAfter: 83.3,
        indicatorScoresBefore: S70,
        indicatorNamesBefore: STARTING_NAMES,
        indicatorScoresAfter: S83,
        indicatorNamesAfter: STARTING_NAMES,
      });
    });
  });

  it("names the mentor who holds the group today in the log of a score another mentor gave", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { mentor, otherMentor, period, ani } = records;
      await saveScores(
        db,
        mentor,
        scoresOf(records, { [ani]: S70 }),
        period.day,
      );
      await replaceTestMentor(db, records.groupId, otherMentor.id, period.day);

      const saved = await saveScores(
        db,
        otherMentor,
        scoresOf(records, { [ani]: S60 }, { [ani]: S70 }),
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
        scoresOf(records, { [ani]: S70 }),
        period.day,
      );
      await replaceTestMentor(db, records.groupId, otherMentor.id, period.day);

      const saved = await saveScores(
        db,
        otherMentor,
        scoresOf(records, { [ani]: S70 }, { [ani]: S70 }),
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
        scoresOf(records, { [ani]: S70 }),
        period.day,
      );
      const fromFirstWindow = scoresOf(records, { [ani]: S87 }, { [ani]: S70 });
      const fromSecondWindow = scoresOf(
        records,
        { [ani]: S60, [budi]: S90 },
        { [ani]: S70 },
      );
      await saveScores(db, mentor, fromFirstWindow, period.day);

      const saved = await saveScores(db, mentor, fromSecondWindow, period.day);

      expect(saved).toEqual(scoresChanged([ani]));
      expect(await keptScoreOf(db, ani)).toBe(86.7);
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
        scoresOf(records, { [ani]: S70 }),
        period.day,
      );

      const saved = await saveScores(
        db,
        mentor,
        scoresOf(records, { [ani]: S90 }),
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
  const kept = (score: number, indicatorScores: number[] | null) => ({
    score,
    indicatorScores,
  });

  it("finds nobody while every score kept is the one the form was opened on", () => {
    const keptNow = new Map([
      ["ani", kept(83.3, S83)],
      ["cici", kept(80, null)],
    ]);

    expect(
      changedSince({ ani: "4,5,4,3,5,4", budi: "", cici: "80" }, keptNow),
    ).toEqual([]);
  });

  it("finds a student whose score is another now, one who got a first score, and one whose box was opened on a score that is not kept", () => {
    const keptNow = new Map([
      ["ani", kept(86.7, S87)],
      ["budi", kept(60, S60)],
    ]);

    expect(
      changedSince({ ani: "4,5,4,3,5,4", budi: "", cici: "80" }, keptNow),
    ).toEqual(["ani", "budi", "cici"]);
  });
});

describe("saveScores refused", () => {
  it.each([6, 0, 4.5, Number.NaN])(
    "saves nothing when one indicator score is %d, which is no whole number from 1 to 5",
    async (score) => {
      await inTestDatabase(async (db) => {
        const records = await addRecords(db);
        const { ani, budi } = records;

        const saved = await saveScores(
          db,
          records.mentor,
          scoresOf(records, { [ani]: S90, [budi]: [score, 4, 4, 4, 4, 4] }),
          records.period.day,
        );

        expect(saved).toEqual(NOT_SCORES);
        expect(await keptScoreOf(db, ani)).toBeNull();
        expect(await keptScoreOf(db, budi)).toBeNull();
      });
    },
  );

  it.each([
    ["five", [4, 4, 4, 4, 4]],
    ["seven", [4, 4, 4, 4, 4, 4, 4]],
  ])(
    "saves nothing when a mentee is sent %s indicator scores",
    async (_, scores) => {
      await inTestDatabase(async (db) => {
        const records = await addRecords(db);
        const { ani, budi } = records;

        const saved = await saveScores(
          db,
          records.mentor,
          scoresOf(records, { [ani]: S90, [budi]: scores }),
          records.period.day,
        );

        expect(saved).toEqual(NOT_SIX_SCORES);
        expect(await keptScoreOf(db, ani)).toBeNull();
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
        scoresOf(records, { [records.ani]: S90 }),
        beforeEveryPeriod,
      );

      expect(saved).toEqual(NO_PERIOD_TO_SCORE);
      expect(await keptScoreOf(db, records.ani)).toBeNull();
    });
  });

  it.each(OTHER_ROLES)("refuses %s, and saves nothing", async (role) => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const other = await addTestAccount(db, `Akun Uji Nilai ${role}`, [role]);

      const saved = await saveScores(
        db,
        other,
        scoresOf(records, { [records.ani]: S90 }),
        records.period.day,
      );

      expect(saved).toEqual(NOT_ALLOWED_TO_SCORE);
      expect(await keptScoreOf(db, records.ani)).toBeNull();
    });
  });

  it("refuses Pengasuh who is also Kepala Unit a group they do not hold", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const both: AccountForAccess = {
        ...records.otherMentor,
        roles: ["mentor", "head_of_unit"],
      };

      const saved = await saveScores(
        db,
        both,
        scoresOf(records, { [records.ani]: S90 }),
        records.period.day,
      );

      expect(saved).toEqual(SCORED_GROUP_NOT_HELD);
      expect(await keptScoreOf(db, records.ani)).toBeNull();
    });
  });

  it("refuses the mentor who held the group before and was replaced", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const saved = await saveScores(
        db,
        records.earlierMentor,
        scoresOf(records, { [records.ani]: S90 }),
        records.period.day,
      );

      expect(saved).toEqual(SCORED_GROUP_NOT_HELD);
      expect(await keptScoreOf(db, records.ani)).toBeNull();
    });
  });

  it("gives the same answer for a group that does not exist and for one that is ended", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { mentor, period, ani } = records;
      const missing = {
        ...scoresOf(records, { [ani]: S90 }),
        groupId: randomUUID(),
      };

      expect(await saveScores(db, mentor, missing, period.day)).toEqual(
        SCORED_GROUP_NOT_HELD,
      );

      await db
        .update(mentorGroups)
        .set({ endedAt: new Date(), endedBy: mentor.id })
        .where(eq(mentorGroups.id, records.groupId));

      expect(
        await saveScores(
          db,
          mentor,
          scoresOf(records, { [ani]: S90 }),
          period.day,
        ),
      ).toEqual(SCORED_GROUP_NOT_HELD);
      expect(await keptScoreOf(db, ani)).toBeNull();
    });
  });

  it("refuses a score for a student of another mentor's group sent under the own group, and saves nothing of that save", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { ani, outsider } = records;

      const saved = await saveScores(
        db,
        records.mentor,
        scoresOf(records, { [ani]: S90, [outsider]: S90 }),
        records.period.day,
      );

      expect(saved).toEqual(NOT_MEMBERS_TO_SCORE);
      expect(await keptScoreOf(db, outsider)).toBeNull();
      expect(await keptScoreOf(db, ani)).toBeNull();
    });
  });

  it("refuses a score for a student of another mentor's group sent under that group", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { outsider } = records;
      const scores = {
        ...scoresOf(records, { [outsider]: S90 }),
        groupId: records.otherGroupId,
      };

      const saved = await saveScores(
        db,
        records.mentor,
        scores,
        records.period.day,
      );

      expect(saved).toEqual(SCORED_GROUP_NOT_HELD);
      expect(await keptScoreOf(db, outsider)).toBeNull();
    });
  });

  it("refuses a score for a member on Cuti, who is not listed, and for a student who does not exist", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { mentor, period, onLeave } = records;

      expect(
        await saveScores(
          db,
          mentor,
          scoresOf(records, { [onLeave]: S80 }),
          period.day,
        ),
      ).toEqual(NOT_MEMBERS_TO_SCORE);
      expect(
        await saveScores(
          db,
          mentor,
          scoresOf(records, { [randomUUID()]: S80 }),
          period.day,
        ),
      ).toEqual(NOT_MEMBERS_TO_SCORE);
      expect(await keptScoreOf(db, onLeave)).toBeNull();
    });
  });

  it("is refused to a Pengasuh for the group of another mentor", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const saved = await saveScores(
        db,
        records.otherMentor,
        scoresOf(records, { [records.ani]: S90 }),
        records.period.day,
      );

      expect(saved).toEqual(SCORED_GROUP_NOT_HELD);
      expect(await keptScoreOf(db, records.ani)).toBeNull();
    });
  });
});
