// Sample Tahun akademik of this file: 4104 to 4105.
import { and, count, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { studentSurveyAnswers, studentSurveyPeriods } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestSurveyPeriod } from "@/mentoring/test-survey-periods";
import { USED_SURVEY_ANSWER } from "@/mentoring/used-survey-answer";
import { cancelSurveyPeriod } from "./change-survey-period";
import { readRunningSurveyCard } from "./survey-card";
import { addTestEvaluator, addTestPeriods } from "./test-evaluations";
import {
  addTestGroup,
  addTestMembersWithStatus,
  addTestProgram,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const TODAY = "4105-10-13";
const EVERY_ROW: RowLimit = { kind: "all" };
const SCORES = [5, 4, 3, 2, 1, 2, 3, 4];

function onlyPrograms(studyProgramIds: number[]): RowLimit {
  return { kind: "some", studyProgramIds, menteesOf: [], studentIds: [] };
}

/**
 * An open survey period, and two programs. The first has a group of
 * three Aktif students and one on Cuti, the second a group of two Aktif
 * students.
 */
async function addRecords(db: Database) {
  const periods = await addTestPeriods(db, 4104);
  const head = await addTestEvaluator(db, ["head_of_unit"], "Kepala Uji Jawab");
  const surveyPeriodId = await addTestSurveyPeriod(db, {
    periodId: periods.runningId,
    openedBy: head.id,
    startsOn: "4105-10-10",
    endsOn: "4105-10-24",
  });
  const first = await addTestProgram(db, "UJIJAWABSATU");
  const second = await addTestProgram(db, "UJIJAWABDUA");
  const firstGroup = await addTestGroup(db, first, { number: 1 });
  const secondGroup = await addTestGroup(db, second, { number: 1 });
  const firstMembers = await addTestMembersWithStatus(
    db,
    { id: firstGroup, studyProgramId: first },
    9900950001,
    ["active", "active", "active", "on_leave"],
  );
  const secondMembers = await addTestMembersWithStatus(
    db,
    { id: secondGroup, studyProgramId: second },
    9900950101,
    ["active", "active"],
  );
  return {
    head,
    surveyPeriodId,
    first: { program: first, group: firstGroup, members: firstMembers },
    second: { program: second, group: secondGroup, members: secondMembers },
  };
}

type Records = Awaited<ReturnType<typeof addRecords>>;

async function addAnswers(
  db: Database,
  of: Records,
  group: Records["first"],
  studentIds: string[],
) {
  for (const studentId of studentIds) {
    await db.insert(studentSurveyAnswers).values({
      surveyPeriodId: of.surveyPeriodId,
      studentId,
      groupId: group.group,
      mentorId: of.head.id,
      scores: SCORES,
      sentAt: new Date(),
    });
  }
}

describe("Responden of the running survey period", () => {
  it("counts the answers sent by the students who can answer, out of all of them", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addAnswers(db, records, records.first, records.first.members);
      await addAnswers(db, records, records.second, [
        records.second.members[0] ?? "",
      ]);

      const card = await readRunningSurveyCard(db, EVERY_ROW, TODAY);

      expect(card?.respondentPool).toBe(5);
      // The student on Cuti answered before going on leave: not counted.
      expect(card?.answered).toBe(4);
      expect(card?.answers).toBe(5);
    });
  });

  it("counts for Ketua Program Studi the answers of their program only", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addAnswers(db, records, records.first, records.first.members);
      await addAnswers(db, records, records.second, records.second.members);

      const own = await readRunningSurveyCard(
        db,
        onlyPrograms([records.second.program]),
        TODAY,
      );
      const none = await readRunningSurveyCard(db, onlyPrograms([]), TODAY);

      expect(own?.answered).toBe(2);
      expect(own?.respondentPool).toBe(2);
      expect(none?.answered).toBe(0);
    });
  });

  it("is 0 while nobody answered", async () => {
    await inTestDatabase(async (db) => {
      await addRecords(db);

      const card = await readRunningSurveyCard(db, EVERY_ROW, TODAY);

      expect(card?.answered).toBe(0);
      expect(card?.answers).toBe(0);
    });
  });
});

describe("the answers of a cancelled survey period", () => {
  it("are kept, marked as not used by the cancel of their period, and count in no recap", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addAnswers(db, records, records.first, records.first.members);
      const usedBefore = await countUsed(db, records.surveyPeriodId);

      const cancelled = await cancelSurveyPeriod(
        db,
        records.head,
        records.surveyPeriodId,
        TODAY,
      );

      expect(cancelled.ok).toBe(true);
      expect(usedBefore).toBe(4);
      expect(await countKept(db, records.surveyPeriodId)).toBe(4);
      expect(await countUsed(db, records.surveyPeriodId)).toBe(0);
    });
  });
});

async function countKept(db: Database, surveyPeriodId: string) {
  const [kept] = await db
    .select({ answers: count() })
    .from(studentSurveyAnswers)
    .where(eq(studentSurveyAnswers.surveyPeriodId, surveyPeriodId));
  return kept?.answers;
}

/** What a recap counts: the used answers of the period. */
async function countUsed(db: Database, surveyPeriodId: string) {
  const [used] = await db
    .select({ answers: count() })
    .from(studentSurveyAnswers)
    .innerJoin(
      studentSurveyPeriods,
      eq(studentSurveyPeriods.id, studentSurveyAnswers.surveyPeriodId),
    )
    .where(
      and(
        eq(studentSurveyAnswers.surveyPeriodId, surveyPeriodId),
        USED_SURVEY_ANSWER,
      ),
    );
  return used?.answers;
}
