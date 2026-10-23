// Sample Tahun akademik of this file: 7341 to 7343.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { mentorSurveyResults, surveyResultFixings } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestSurveyAnswer,
  addTestSurveyPeriod,
} from "@/mentoring/test-survey-periods";
import {
  ALREADY_FIXED,
  fixSurveyResults,
  NOT_ALLOWED_TO_FIX,
  NOT_FIXABLE,
} from "./fix-survey-results";
import { addTestEvaluator, addTestPeriods } from "./test-evaluations";
import {
  addTestGroup,
  addTestMembersWithStatus,
  addTestMentor,
  addTestMentorLine,
  addTestProgram,
} from "./test-records";
import { addTestAssessor, addTestScores, allScores } from "./test-scores";

const inTestDatabase = withTestDatabase();

const TODAY = "7342-11-01";

interface Records {
  head: AccountForAccess;
  surveyId: string;
  /** Three answers for its mentor, and a Capaian karakter. */
  full: { groupId: string; mentorId: string };
  /** Two answers only. */
  few: { groupId: string; mentorId: string };
  /** Three answers, and nobody assessed. */
  unassessed: { groupId: string; mentorId: string };
}

async function addGroupWithAnswers(
  db: Database,
  surveyId: string,
  number: number,
  answers: number,
  scores: number[],
) {
  const program = await addTestProgram(db, `UJITETAP${number}`);
  const groupId = await addTestGroup(db, program, { number });
  const mentorId = await addTestMentor(db, {
    name: `Pengasuh Tetap ${number}`,
  });
  await addTestMentorLine(db, groupId, mentorId);
  const members = await addTestMembersWithStatus(
    db,
    { id: groupId, studyProgramId: program },
    9900734100 + number * 10,
    ["active", "active", "active", "active"],
  );
  for (const studentId of members.slice(0, answers)) {
    await addTestSurveyAnswer(db, {
      surveyPeriodId: surveyId,
      groupId,
      mentorId,
      studentId,
      scores,
    });
  }
  return { groupId, mentorId, members };
}

/** A closed survey period with three groups, and its Kepala Unit. */
async function addRecords(db: Database, closed = true): Promise<Records> {
  const periods = await addTestPeriods(db, 7341);
  const head = await addTestEvaluator(db, ["head_of_unit"], "Kepala Uji Tetap");
  const closing = closed
    ? { closedBy: head.id, closedAt: new Date("7342-10-21T03:00:00Z") }
    : {};
  const surveyId = await addTestSurveyPeriod(db, {
    periodId: periods.runningId,
    openedBy: head.id,
    startsOn: "7342-10-01",
    endsOn: closed ? "7342-10-20" : "7342-11-20",
    ...closing,
  });
  const low = [2, 3, 2, 2, 3, 2, 3, 2];
  const full = await addGroupWithAnswers(db, surveyId, 1, 3, low);
  const few = await addGroupWithAnswers(db, surveyId, 2, 2, low);
  const unassessed = await addGroupWithAnswers(db, surveyId, 3, 3, low);
  const by = await addTestAssessor(db, 7343);
  const [first] = full.members;
  const [other] = few.members;
  if (!first || !other) throw new Error("No members.");
  const before = new Date("7342-10-10T03:00:00Z");
  await addTestScores(db, by, first, allScores(74), before);
  await addTestScores(db, by, other, allScores(90), before);
  return { head, surveyId, full, few, unassessed };
}

function linesOf(db: Database, fixingId: string) {
  return db
    .select()
    .from(mentorSurveyResults)
    .where(eq(mentorSurveyResults.fixingId, fixingId));
}

async function fixingsOf(db: Database, surveyId: string) {
  return db
    .select()
    .from(surveyResultFixings)
    .where(eq(surveyResultFixings.surveyPeriodId, surveyId));
}

describe("fixSurveyResults", () => {
  it("writes a line for each group with 3 answers or more and a Capaian karakter, and keeps who fixed them and when", async () => {
    await inTestDatabase(async (db) => {
      const { head, surveyId, full } = await addRecords(db);

      const fixed = await fixSurveyResults(db, head, surveyId, TODAY);

      expect(fixed).toEqual({ ok: true, value: { lines: 1 } });
      const [fixing] = await fixingsOf(db, surveyId);
      expect(fixing?.fixedBy).toBe(head.id);
      expect(fixing?.fixedAt).toBeInstanceOf(Date);
      // 2, 3 and 2 for the eight statements, 19 for each answer: 47,5 of 100.
      expect(await linesOf(db, fixing?.id ?? "")).toEqual([
        expect.objectContaining({
          groupId: full.groupId,
          mentorId: full.mentorId,
          respondents: 3,
          members: 4,
          achievement: 74,
          feedback: 47.5,
          score: 60.8,
        }),
      ]);
    });
  });

  it("is refused a second time, and writes no line twice", async () => {
    await inTestDatabase(async (db) => {
      const { head, surveyId } = await addRecords(db);
      await fixSurveyResults(db, head, surveyId, TODAY);

      const again = await fixSurveyResults(db, head, surveyId, TODAY);

      expect(again).toEqual(ALREADY_FIXED);
      const fixings = await fixingsOf(db, surveyId);
      expect(fixings).toHaveLength(1);
      expect(await linesOf(db, fixings[0]?.id ?? "")).toHaveLength(1);
    });
  });

  it("is refused while the period runs", async () => {
    await inTestDatabase(async (db) => {
      const { head, surveyId } = await addRecords(db, false);

      expect(await fixSurveyResults(db, head, surveyId, TODAY)).toEqual(
        NOT_FIXABLE,
      );
      expect(await fixingsOf(db, surveyId)).toEqual([]);
    });
  });

  it("fixes a period that ended by its last day", async () => {
    await inTestDatabase(async (db) => {
      const { head, surveyId } = await addRecords(db, false);

      const fixed = await fixSurveyResults(db, head, surveyId, "7342-11-21");

      expect(fixed.ok).toBe(true);
    });
  });

  it("is refused for a cancelled period and for an id that names none", async () => {
    await inTestDatabase(async (db) => {
      const periods = await addTestPeriods(db, 7341);
      const head = await addTestEvaluator(db, ["head_of_unit"]);
      const cancelled = await addTestSurveyPeriod(db, {
        periodId: periods.runningId,
        openedBy: head.id,
        startsOn: "7342-10-01",
        endsOn: "7342-10-20",
        cancelledBy: head.id,
        cancelledAt: new Date("7342-10-02T03:00:00Z"),
      });

      expect(await fixSurveyResults(db, head, cancelled, TODAY)).toEqual(
        NOT_FIXABLE,
      );
      expect(await fixSurveyResults(db, head, "bukan-id", TODAY)).toEqual(
        NOT_FIXABLE,
      );
      expect(
        await fixSurveyResults(db, head, crypto.randomUUID(), TODAY),
      ).toEqual(NOT_FIXABLE);
    });
  });

  it.each<RoleId>([
    "director",
    "head_of_program",
    "upk_staff",
    "mentor",
    "student",
  ])("is refused for %s, and writes nothing", async (role) => {
    await inTestDatabase(async (db) => {
      const { surveyId } = await addRecords(db);
      const other = await addTestEvaluator(db, [role], "Akun Uji Lain");

      expect(await fixSurveyResults(db, other, surveyId, TODAY)).toEqual(
        NOT_ALLOWED_TO_FIX,
      );
      expect(await fixingsOf(db, surveyId)).toEqual([]);
    });
  });
});
