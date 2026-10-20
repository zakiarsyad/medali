// Sample Tahun akademik of this file: 4103 to 4103.
// Sample NIMs of this file: 9900940000 to 9900940099.
import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { studentSurveyAnswers } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { sendOwnSurvey } from "./send-own-survey";
import { addTestSurvey } from "./test-survey";

/*
 * A survey period is never erased, so no rows are removed after the
 * check: the database is dropped at the end.
 */
const own = withOwnTestDatabase("isisurvei");

describe("Kirim survei pressed twice, or sent from two devices, at the same moment", () => {
  it("keeps one answer for the student and period: the later one", async () => {
    const survey = await addTestSurvey(own.db, {
      startYear: 4103,
      nim: "9900940001",
    });
    const both = await own.atOnce(
      (db) =>
        sendOwnSurvey(db, survey.student, {
          surveyPeriodId: survey.surveyPeriodId,
          mentorId: survey.mentorId,
          scores: [2, 2, 2, 2, 2, 2, 2, 2],
          suggestion: "",
        }),
      (db) =>
        sendOwnSurvey(db, survey.student, {
          surveyPeriodId: survey.surveyPeriodId,
          mentorId: survey.mentorId,
          scores: [5, 5, 5, 5, 5, 5, 5, 5],
          suggestion: "",
        }),
    );

    expect(both.sooner).toMatchObject({ ok: true });
    expect(both.later).toMatchObject({ ok: true });
    const kept = await own.db
      .select({ scores: studentSurveyAnswers.scores })
      .from(studentSurveyAnswers)
      .where(eq(studentSurveyAnswers.studentId, survey.studentId));
    expect(kept).toEqual([{ scores: [5, 5, 5, 5, 5, 5, 5, 5] }]);
  });
});

describe("Kirim survei on the screen", () => {
  it("is switched off while an answer is on its way, so two presses send one", () => {
    const code = readFileSync(
      "src/features/students/own-survey-form.tsx",
      "utf8",
    );
    const send = code.match(/<button\b[^>]*>\s*Kirim survei/s);

    expect(send?.[0]).toContain("disabled={isSending}");
  });
});
