// Sample Tahun akademik of this file: 7311 to 7313.
import { eq, inArray } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestPenaltyOf } from "@/discipline-penalties/test-penalties";
import {
  addTestSurveyAnswer,
  addTestSurveyPeriod,
} from "@/mentoring/test-survey-periods";
import { readSurveyGroupRows } from "./survey-group-reads";
import type { ResultPeriod } from "./survey-result-periods";
import { addTestEvaluator, addTestPeriods } from "./test-evaluations";
import {
  addTestEndedGroup,
  addTestGroup,
  addTestMembersWithStatus,
  addTestMentor,
  addTestMentorLine,
  addTestProgram,
} from "./test-records";
import { addTestAssessor, addTestScores, allScores } from "./test-scores";

const inTestDatabase = withTestDatabase();

const EVERY_ROW: RowLimit = { kind: "all" };
const DAY = "7312-10-13";

function onlyPrograms(studyProgramIds: number[]): RowLimit {
  return { kind: "some", studyProgramIds, menteesOf: [], studentIds: [] };
}

function resultPeriod(id: string, more: Partial<ResultPeriod> = {}) {
  return {
    id,
    period: { startYear: 7312, term: "odd" },
    startsOn: "7312-10-01",
    endsOn: "7312-10-20",
    achievementWeight: 50,
    status: "open",
    numbersDay: DAY,
    fixed: null,
    ...more,
  } as const satisfies ResultPeriod;
}

/**
 * A survey period closed by hand, so another can be added beside it, and
 * a cancelled one of the same academic period.
 */
async function addSurveys(db: Database) {
  const periods = await addTestPeriods(db, 7311);
  const head = await addTestEvaluator(db, ["head_of_unit"]);
  const of = {
    periodId: periods.runningId,
    openedBy: head.id,
    startsOn: "7312-10-01",
    endsOn: "7312-10-20",
  };
  const closed = await addTestSurveyPeriod(db, {
    ...of,
    closedBy: head.id,
    closedAt: new Date("7312-10-21T03:00:00Z"),
  });
  const cancelled = await addTestSurveyPeriod(db, {
    ...of,
    cancelledBy: head.id,
    cancelledAt: new Date("7312-10-02T03:00:00Z"),
  });
  return { closed, cancelled };
}

async function addSurvey(db: Database): Promise<string> {
  return (await addSurveys(db)).closed;
}

/**
 * A program with one group of four Aktif members and one on Cuti. Its
 * first mentor held it until 7312-10-05, the second since.
 */
async function addGroup(db: Database) {
  const program = await addTestProgram(db, "UJIHASILSATU");
  const groupId = await addTestGroup(db, program, { number: 1 });
  const earlier = await addTestMentor(db, { name: "Pengasuh Uji Lama" });
  const later = await addTestMentor(db, { name: "Pengasuh Uji Baru" });
  await addTestMentorLine(db, groupId, earlier, { endsOn: "7312-10-05" });
  await addTestMentorLine(db, groupId, later, { startsOn: "7312-10-05" });
  const members = await addTestMembersWithStatus(
    db,
    { id: groupId, studyProgramId: program },
    9900731101,
    ["active", "active", "active", "active", "on_leave"],
  );
  return { program, groupId, earlier, later, members };
}

describe("readSurveyGroupRows", () => {
  it("adds up the answers of a group for each mentor they were sent for, with its Aktif members and Capaian karakter", async () => {
    await inTestDatabase(async (db) => {
      const surveyId = await addSurvey(db);
      const { groupId, earlier, later, members } = await addGroup(db);
      const [one, two, three, four] = members;
      if (!one || !two || !three || !four) throw new Error("No members.");
      const of = { surveyPeriodId: surveyId, groupId };
      await addTestSurveyAnswer(db, { ...of, studentId: one, mentorId: later });
      await addTestSurveyAnswer(db, {
        ...of,
        studentId: two,
        mentorId: later,
        scores: [5, 5, 5, 5, 5, 5, 5, 5],
      });
      await addTestSurveyAnswer(db, {
        ...of,
        studentId: three,
        mentorId: later,
      });
      await addTestSurveyAnswer(db, {
        ...of,
        studentId: four,
        mentorId: earlier,
      });
      const by = await addTestAssessor(db, 7313);
      await addTestScores(db, by, one, allScores(70));
      await addTestScores(db, by, two, allScores(80));

      const rows = await readSurveyGroupRows(
        db,
        EVERY_ROW,
        resultPeriod(surveyId),
      );

      expect(rows.map((row) => [row.mentorName, row.result.answers])).toEqual(
        expect.arrayContaining([
          ["Pengasuh Uji Baru", 3],
          ["Pengasuh Uji Lama", 1],
        ]),
      );
      const held = rows.find((row) => row.mentorId === later);
      expect(held?.group).toMatchObject({
        id: groupId,
        programCode: "UJIHASILSATU",
        members: 4,
      });
      // 4, 5 and 4 for each statement: 13 / 3 = 4,3 and 86,7 of 100.
      expect(held?.result).toEqual({
        answers: 3,
        members: 4,
        share: 75,
        achievement: 75,
        feedbackOutOfFive: 4.3,
        feedback: 86.7,
        score: 80.9,
        result: "good",
      });
      const left = rows.find((row) => row.mentorId === earlier);
      expect(left?.result.feedback).toBe(null);
    });
  });

  it("keeps Capaian karakter of a period that is over as it was on its closing day", async () => {
    await inTestDatabase(async (db) => {
      const surveyId = await addSurvey(db);
      const { groupId, members } = await addGroup(db);
      const [one, two] = members;
      if (!one || !two) throw new Error("No members.");
      const by = await addTestAssessor(db, 7313);
      const closingDay = "7312-10-21";
      const onTheDay = new Date(`${closingDay}T20:00:00+07:00`);
      const nextDay = new Date("7312-10-22T08:00:00+07:00");
      await addTestScores(db, by, one, allScores(70), onTheDay);
      await addTestScores(db, by, one, allScores(90), nextDay);
      await addTestScores(db, by, two, allScores(60), nextDay);
      const recorder = await addTestMentor(db, { name: "Pencatat Uji Hasil" });
      const medium = { category: "medium", level: 1 } as const;
      await addTestPenaltyOf(db, one, recorder, medium, "7312-10-25");

      const over = resultPeriod(surveyId, {
        status: "closed",
        numbersDay: closingDay,
      });
      const later = resultPeriod(surveyId, { numbersDay: "7312-10-25" });
      const achievementOn = async (period: ResultPeriod) => {
        const rows = await readSurveyGroupRows(db, EVERY_ROW, period);
        return rows.find((row) => row.group.id === groupId)?.result.achievement;
      };

      expect(await achievementOn(over)).toBe(70);
      // By the later day both are assessed, and the penalty holds 90 at 70.
      expect(await achievementOn(later)).toBe(65);
    });
  });

  it("gives a group without answers the mentor who held it on the day of the numbers", async () => {
    await inTestDatabase(async (db) => {
      const surveyId = await addSurvey(db);
      const { groupId } = await addGroup(db);

      const before = await readSurveyGroupRows(
        db,
        EVERY_ROW,
        resultPeriod(surveyId, { numbersDay: "7312-10-04" }),
      );
      const after = await readSurveyGroupRows(
        db,
        EVERY_ROW,
        resultPeriod(surveyId),
      );

      const ofGroup = (rows: typeof before) =>
        rows.filter((row) => row.group.id === groupId);
      expect(ofGroup(before).map((row) => row.mentorName)).toEqual([
        "Pengasuh Uji Lama",
      ]);
      expect(ofGroup(after).map((row) => row.mentorName)).toEqual([
        "Pengasuh Uji Baru",
      ]);
      expect(ofGroup(after)[0]?.result.answers).toBe(0);
    });
  });

  it("counts only the answers of the group's Aktif members of today, so Responden never passes the members", async () => {
    await inTestDatabase(async (db) => {
      const surveyId = await addSurvey(db);
      const { program, groupId, later, members } = await addGroup(db);
      const [one, two, three] = members;
      if (!one || !two || !three) throw new Error("No members.");
      const of = { surveyPeriodId: surveyId, groupId, mentorId: later };
      for (const studentId of [one, two, three]) {
        await addTestSurveyAnswer(db, { ...of, studentId });
      }
      // The third goes on Cuti; another student who left the group answered too.
      await db
        .update(students)
        .set({ status: "on_leave" })
        .where(eq(students.id, three));
      const [gone] = await addTestMembersWithStatus(
        db,
        {
          id: await addTestGroup(db, program, { number: 9 }),
          studyProgramId: program,
        },
        9900731191,
        ["active"],
      );
      if (!gone) throw new Error("No student.");
      await addTestSurveyAnswer(db, { ...of, studentId: gone });
      await db
        .update(students)
        .set({ status: "inactive" })
        .where(inArray(students.id, members.slice(3)));

      const rows = await readSurveyGroupRows(
        db,
        EVERY_ROW,
        resultPeriod(surveyId),
      );

      const row = rows.find((one) => one.group.id === groupId);
      expect(row?.result).toMatchObject({
        answers: 2,
        members: 2,
        share: 100,
        feedback: null,
      });
    });
  });

  it("counts no answer of another period, a cancelled one among them", async () => {
    await inTestDatabase(async (db) => {
      const { closed, cancelled } = await addSurveys(db);
      const { groupId, later, members } = await addGroup(db);
      for (const studentId of members.slice(0, 3)) {
        const answer = { groupId, studentId, mentorId: later };
        await addTestSurveyAnswer(db, { ...answer, surveyPeriodId: cancelled });
      }

      const rows = await readSurveyGroupRows(
        db,
        EVERY_ROW,
        resultPeriod(closed),
      );
      const asCancelled = await readSurveyGroupRows(
        db,
        EVERY_ROW,
        resultPeriod(cancelled),
      );

      const own = (found: typeof rows) =>
        found
          .filter((row) => row.group.id === groupId)
          .map((row) => row.result.answers);
      expect(own(rows)).toEqual([0]);
      expect(own(asCancelled)).toEqual([0]);
    });
  });

  it("shows Ketua Program Studi the groups of their program only, and no ended group nor one started after the day", async () => {
    await inTestDatabase(async (db) => {
      const surveyId = await addSurvey(db);
      const { program, groupId } = await addGroup(db);
      const other = await addTestProgram(db, "UJIHASILDUA");
      const otherGroup = await addTestGroup(db, other);
      await addTestEndedGroup(db, program, { number: 2 });
      const late = await addTestGroup(db, program, {
        number: 3,
        startsOn: "7312-11-01",
      });

      const own = await readSurveyGroupRows(
        db,
        onlyPrograms([program]),
        resultPeriod(surveyId),
      );
      const none = await readSurveyGroupRows(
        db,
        onlyPrograms([]),
        resultPeriod(surveyId),
      );
      const all = await readSurveyGroupRows(
        db,
        EVERY_ROW,
        resultPeriod(surveyId),
      );

      expect(own.map((row) => row.group.id)).toEqual([groupId]);
      expect(none).toEqual([]);
      const ids = all.map((row) => row.group.id);
      expect(ids).toContain(otherGroup);
      expect(ids).not.toContain(late);
    });
  });
});
