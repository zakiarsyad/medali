import { describe, expect, it } from "vitest";
import { samplePeriods } from "./sample-data";
import { sampleSurveyPeriods } from "./sample-survey-periods";

const DAY = "2026-10-13";
const periods = samplePeriods(DAY);
const surveys = sampleSurveyPeriods(periods);

describe("sampleSurveyPeriods", () => {
  it("is one survey period, of the academic period before the running one", () => {
    expect(surveys).toHaveLength(1);
    expect(surveys[0]?.period).toBe(periods[1]);
  });

  it("lasts three weeks inside its academic period", () => {
    const [survey] = surveys;

    expect(survey).toMatchObject({
      startsOn: "2026-06-01",
      endsOn: "2026-06-21",
    });
    expect((survey?.startsOn ?? "") >= (survey?.period.startsOn ?? "")).toBe(
      true,
    );
    expect((survey?.endsOn ?? "") <= (survey?.period.endsOn ?? "")).toBe(true);
  });

  it("was opened before its first day and closed on its last, both before the day", () => {
    const [survey] = surveys;

    expect(survey?.openedOn).toBe("2026-05-28");
    expect(survey?.closedOn).toBe(survey?.endsOn);
    expect((survey?.closedOn ?? "") < DAY).toBe(true);
  });

  it("weighs both parts the same and says it is sample data", () => {
    expect(surveys[0]).toMatchObject({
      achievementWeight: 50,
      note: "Data contoh periode lalu.",
    });
  });

  it("is the same every time it is asked for", () => {
    expect(sampleSurveyPeriods(samplePeriods(DAY))).toEqual(surveys);
  });

  it.each(["2026-02-01", "2026-07-31", "2026-08-01", "2027-01-31"])(
    "is over on %s, as on any day of the year",
    (day) => {
      const [survey] = sampleSurveyPeriods(samplePeriods(day));

      expect(survey).toBeDefined();
      expect((survey?.closedOn ?? "") < day).toBe(true);
    },
  );

  it("is empty without a period before the running one", () => {
    expect(sampleSurveyPeriods(periods.slice(0, 1))).toEqual([]);
  });
});
