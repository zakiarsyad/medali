// Sample Tahun akademik of this file: 4101 to 4101.
// Sample NIMs of this file: 9900920000 to 9900920099.
import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import { daysAfter } from "@/academic-periods/days-after";
import { withTestDatabase } from "@/db/test-database";
import { readOwnSurvey } from "./own-survey";
import { sendOwnSurvey } from "./send-own-survey";
import { addTestSurvey } from "./test-survey";

const inTestDatabase = withTestDatabase();

const TODAY = campusDay();
const SCORES = [5, 4, 3, 2, 1, 2, 3, 4];

describe("readOwnSurvey", () => {
  it("gives a student of a group the period that is Dibuka, its last day and their mentor, with nothing sent yet", async () => {
    await inTestDatabase(async (db) => {
      const survey = await addTestSurvey(db, {
        startYear: 4101,
        nim: "9900920001",
      });

      const card = await readOwnSurvey(db, survey.student, TODAY);

      expect(card).toMatchObject({
        surveyPeriodId: survey.surveyPeriodId,
        periodTitle: "Ganjil 4101/4102",
        mentorId: survey.mentorId,
        mentorName: "Pengasuh Uji 9900920001",
        sent: null,
      });
      expect(card?.endsOn).toBe(daysAfter(TODAY, 14));
    });
  });

  it("gives back what the student sent, for the mentor named at the send", async () => {
    await inTestDatabase(async (db) => {
      const survey = await addTestSurvey(db, {
        startYear: 4101,
        nim: "9900920002",
      });
      const at = new Date();
      await sendOwnSurvey(
        db,
        survey.student,
        {
          surveyPeriodId: survey.surveyPeriodId,
          mentorId: survey.mentorId,
          scores: SCORES,
          suggestion: "Lanjutkan.",
        },
        at,
      );

      const card = await readOwnSurvey(db, survey.student, TODAY);

      expect(card?.sent).toEqual({
        scores: SCORES,
        suggestion: "Lanjutkan.",
        sentAt: at,
        mentorName: "Pengasuh Uji 9900920002",
      });
    });
  });
});

describe("sendOwnSurvey", () => {
  it("keeps a complete answer for the student, their group and their mentor", async () => {
    await inTestDatabase(async (db) => {
      const survey = await addTestSurvey(db, {
        startYear: 4101,
        nim: "9900920003",
      });

      const sent = await sendOwnSurvey(db, survey.student, {
        surveyPeriodId: survey.surveyPeriodId,
        mentorId: survey.mentorId,
        scores: SCORES,
        suggestion: "",
      });
      const card = await readOwnSurvey(db, survey.student, TODAY);

      expect(sent.ok).toBe(true);
      expect(card?.sent?.scores).toEqual(SCORES);
      expect(card?.sent?.suggestion).toBe(null);
    });
  });

  it("saves nothing and names the statement left unanswered", async () => {
    await inTestDatabase(async (db) => {
      const survey = await addTestSurvey(db, {
        startYear: 4101,
        nim: "9900920004",
      });

      const sent = await sendOwnSurvey(db, survey.student, {
        surveyPeriodId: survey.surveyPeriodId,
        mentorId: survey.mentorId,
        scores: [5, 4, 3, 0, 1, 2, 3, 4],
        suggestion: "",
      });
      const card = await readOwnSurvey(db, survey.student, TODAY);

      expect(sent).toEqual({ ok: false, error: "Pernyataan 4 belum dijawab." });
      expect(card?.sent).toBe(null);
    });
  });
});
