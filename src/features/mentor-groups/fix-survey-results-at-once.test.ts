import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { mentorSurveyResults, surveyResultFixings } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import {
  addTestSurveyAnswer,
  addTestSurveyPeriod,
} from "@/mentoring/test-survey-periods";
import { ALREADY_FIXED, fixSurveyResults } from "./fix-survey-results";
import { addTestEvaluator, addTestPeriods } from "./test-evaluations";
import {
  addTestGroup,
  addTestMembersWithStatus,
  addTestMentor,
  addTestMentorLine,
  addTestProgram,
} from "./test-records";
import { addTestAssessor, addTestScores, allScores } from "./test-scores";

/*
 * Fixed results are never erased, so no rows are removed after the
 * check: the database is dropped at the end.
 */
const own = withOwnTestDatabase("tetapsurvei");

describe("Tetapkan hasil evaluasi sent twice at the same moment", () => {
  it("fixes once: the second waits, then is told the results are fixed, and no group gets two lines", async () => {
    const db = own.db;
    const periods = await addTestPeriods(db, 2401);
    const first = await addTestEvaluator(db, ["head_of_unit"], "Kepala A");
    const second = await addTestEvaluator(db, ["head_of_unit"], "Kepala B");
    const surveyId = await addTestSurveyPeriod(db, {
      periodId: periods.runningId,
      openedBy: first.id,
      startsOn: "2402-10-01",
      endsOn: "2402-10-20",
      closedBy: first.id,
      closedAt: new Date("2402-10-21T03:00:00Z"),
    });
    const program = await addTestProgram(db, "UJITETAPSEKALIGUS");
    const groupId = await addTestGroup(db, program);
    const mentorId = await addTestMentor(db, { name: "Pengasuh Sekaligus" });
    await addTestMentorLine(db, groupId, mentorId);
    const members = await addTestMembersWithStatus(
      db,
      { id: groupId, studyProgramId: program },
      9900735101,
      ["active", "active", "active"],
    );
    for (const studentId of members) {
      const answer = { surveyPeriodId: surveyId, groupId, mentorId, studentId };
      await addTestSurveyAnswer(db, answer);
    }
    const by = await addTestAssessor(db, 2403);
    const [assessed] = members;
    if (!assessed) throw new Error("No member.");
    const before = new Date("2402-10-10T03:00:00Z");
    await addTestScores(db, by, assessed, allScores(80), before);
    const today = "2402-11-01";

    const both = await own.atOnce(
      (tx) => fixSurveyResults(tx, first, surveyId, today),
      (tx) => fixSurveyResults(tx, second, surveyId, today),
    );

    expect(both.sooner).toEqual({ ok: true, value: { lines: 1 } });
    expect(both.later).toEqual(ALREADY_FIXED);
    const fixings = await db
      .select()
      .from(surveyResultFixings)
      .where(eq(surveyResultFixings.surveyPeriodId, surveyId));
    expect(fixings.map((fixing) => fixing.fixedBy)).toEqual([first.id]);
    const lines = await db
      .select()
      .from(mentorSurveyResults)
      .where(eq(mentorSurveyResults.groupId, groupId));
    expect(lines).toHaveLength(1);
  });
});
