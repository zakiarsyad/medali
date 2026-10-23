// Sample Tahun akademik of this file: 7301 to 7302.
import { describe, expect, it } from "vitest";
import { withTestDatabase } from "@/db/test-database";
import { addTestSurveyPeriod } from "@/mentoring/test-survey-periods";
import {
  chooseResultPeriod,
  type ResultPeriod,
  readResultPeriods,
} from "./survey-result-periods";
import { addTestEvaluator, addTestPeriods } from "./test-evaluations";

const inTestDatabase = withTestDatabase();

const TODAY = "7302-10-13";

describe("readResultPeriods", () => {
  it("gives every period that was not cancelled, the latest first, with its status and the day of its numbers", async () => {
    await inTestDatabase(async (db) => {
      const periods = await addTestPeriods(db, 7301);
      const head = await addTestEvaluator(db, ["head_of_unit"]);
      const of = { periodId: periods.beforeId, openedBy: head.id };
      const closedAt = new Date("7302-05-20T03:00:00Z");
      const closed = await addTestSurveyPeriod(db, {
        ...of,
        startsOn: "7302-05-01",
        endsOn: "7302-05-30",
        achievementWeight: 40,
        closedBy: head.id,
        closedAt,
      });
      const ended = await addTestSurveyPeriod(db, {
        ...of,
        startsOn: "7302-06-01",
        endsOn: "7302-06-21",
      });
      await addTestSurveyPeriod(db, {
        ...of,
        startsOn: "7302-07-01",
        endsOn: "7302-07-14",
        cancelledBy: head.id,
        cancelledAt: new Date(),
      });

      const found = await readResultPeriods(db, TODAY);

      expect(found).toEqual([
        {
          id: ended,
          period: { startYear: 7301, term: "even" },
          startsOn: "7302-06-01",
          endsOn: "7302-06-21",
          achievementWeight: 50,
          status: "ended",
          numbersDay: "7302-06-21",
        },
        {
          id: closed,
          period: { startYear: 7301, term: "even" },
          startsOn: "7302-05-01",
          endsOn: "7302-05-30",
          achievementWeight: 40,
          status: "closed",
          numbersDay: "7302-05-20",
        },
      ]);
    });
  });

  it("gives a period that runs with today as the day of its numbers", async () => {
    await inTestDatabase(async (db) => {
      const periods = await addTestPeriods(db, 7301);
      const head = await addTestEvaluator(db, ["head_of_unit"]);
      const open = await addTestSurveyPeriod(db, {
        periodId: periods.runningId,
        openedBy: head.id,
        startsOn: "7302-10-10",
        endsOn: "7302-10-24",
      });

      expect(await readResultPeriods(db, TODAY)).toEqual([
        {
          id: open,
          period: { startYear: 7302, term: "odd" },
          startsOn: "7302-10-10",
          endsOn: "7302-10-24",
          achievementWeight: 50,
          status: "open",
          numbersDay: TODAY,
        },
      ]);
    });
  });

  it("gives nothing while no period was opened", async () => {
    await inTestDatabase(async (db) => {
      expect(await readResultPeriods(db, TODAY)).toEqual([]);
    });
  });
});

function period(id: string, status: ResultPeriod["status"]): ResultPeriod {
  return {
    id,
    period: { startYear: 7302, term: "odd" },
    startsOn: "7302-10-10",
    endsOn: "7302-10-24",
    achievementWeight: 50,
    status,
    numbersDay: TODAY,
  };
}

describe("chooseResultPeriod", () => {
  const periods = [
    period("terjadwal", "scheduled"),
    period("berakhir", "ended"),
    period("ditutup", "closed"),
  ];

  it("takes the period the address names", () => {
    expect(chooseResultPeriod(periods, "ditutup")?.id).toBe("ditutup");
  });

  it("takes the one that runs when the address names none, or one that is not there", () => {
    expect(chooseResultPeriod(periods, null)?.id).toBe("terjadwal");
    expect(chooseResultPeriod(periods, "lain")?.id).toBe("terjadwal");
  });

  it("takes the latest while none runs", () => {
    expect(chooseResultPeriod(periods.slice(1), null)?.id).toBe("berakhir");
  });

  it("takes none while there is none", () => {
    expect(chooseResultPeriod([], null)).toBe(null);
  });
});
