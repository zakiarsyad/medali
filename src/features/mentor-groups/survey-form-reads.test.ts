// Sample Tahun akademik of this file: 2147 to 2148.
import { describe, expect, it } from "vitest";
import { withTestDatabase } from "@/db/test-database";
import { addTestSurveyPeriod } from "@/mentoring/test-survey-periods";
import { readSurveyFormStart } from "./survey-form-reads";
import { addTestEvaluator, addTestPeriods } from "./test-evaluations";

const inTestDatabase = withTestDatabase();

const START_YEAR = 2147;
const TODAY = "2148-10-13";
const DAYS = { startsOn: "2148-06-01", endsOn: "2148-06-21" };

describe("readSurveyFormStart", () => {
  it("offers the running academic period and the one before, neither opened before", async () => {
    await inTestDatabase(async (db) => {
      const periods = await addTestPeriods(db, START_YEAR);

      const start = await readSurveyFormStart(db, TODAY);

      expect(start).toEqual({
        choices: [
          {
            id: periods.runningId,
            title: "Ganjil 2148/2149",
            wasOpened: false,
          },
          { id: periods.beforeId, title: "Genap 2147/2148", wasOpened: false },
        ],
        startsOn: TODAY,
        endsOn: "2148-10-27",
        achievementWeight: 50,
      });
    });
  });

  it("marks the Periode of a survey period that was closed by hand as opened before", async () => {
    await inTestDatabase(async (db) => {
      const periods = await addTestPeriods(db, START_YEAR);
      const head = await addTestEvaluator(db, ["head_of_unit"]);
      await addTestSurveyPeriod(db, {
        periodId: periods.beforeId,
        openedBy: head.id,
        closedBy: head.id,
        closedAt: new Date(),
        ...DAYS,
      });

      const { choices } = await readSurveyFormStart(db, TODAY);

      expect(choices.map((choice) => choice.wasOpened)).toEqual([false, true]);
    });
  });

  it("does not count a survey period that was cancelled", async () => {
    await inTestDatabase(async (db) => {
      const periods = await addTestPeriods(db, START_YEAR);
      const head = await addTestEvaluator(db, ["head_of_unit"]);
      await addTestSurveyPeriod(db, {
        periodId: periods.beforeId,
        openedBy: head.id,
        cancelledBy: head.id,
        cancelledAt: new Date(),
        ...DAYS,
      });

      const { choices } = await readSurveyFormStart(db, TODAY);

      expect(choices.map((choice) => choice.wasOpened)).toEqual([false, false]);
    });
  });
});
