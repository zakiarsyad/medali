import { describe, expect, it } from "vitest";
import type { AcademicPeriod } from "@/academic-periods/academic-period";
import {
  openAgainQuestion,
  surveyFormStart,
  typedFeedbackWeight,
} from "./survey-form-start";

const TODAY = "2026-10-13";

const PERIODS: AcademicPeriod[] = [
  {
    id: "ganjil-2026",
    startYear: 2026,
    term: "odd",
    startsOn: "2026-08-01",
    endsOn: "2027-01-31",
  },
  {
    id: "genap-2025",
    startYear: 2025,
    term: "even",
    startsOn: "2026-02-01",
    endsOn: "2026-07-31",
  },
  {
    id: "ganjil-2025",
    startYear: 2025,
    term: "odd",
    startsOn: "2025-08-01",
    endsOn: "2026-01-31",
  },
  {
    id: "genap-2026",
    startYear: 2026,
    term: "even",
    startsOn: "2027-02-01",
    endsOn: "2027-07-31",
  },
];

describe("surveyFormStart", () => {
  it("starts with today, 14 days later and a weight of 50", () => {
    expect(surveyFormStart(PERIODS, [], TODAY)).toMatchObject({
      startsOn: "2026-10-13",
      endsOn: "2026-10-27",
      achievementWeight: 50,
    });
  });

  it("offers the running academic period first, then the one before, and no other", () => {
    const { choices } = surveyFormStart(PERIODS, [], TODAY);

    expect(choices).toEqual([
      { id: "ganjil-2026", title: "Ganjil 2026/2027", wasOpened: false },
      { id: "genap-2025", title: "Genap 2025/2026", wasOpened: false },
    ]);
  });

  it("marks the Periode a survey period was opened for before", () => {
    const { choices } = surveyFormStart(PERIODS, ["genap-2025"], TODAY);

    expect(choices.map((choice) => choice.wasOpened)).toEqual([false, true]);
  });

  it("offers the running period alone when none came before it", () => {
    const { choices } = surveyFormStart(PERIODS.slice(2, 3), [], TODAY);

    expect(choices.map((choice) => choice.id)).toEqual(["ganjil-2025"]);
  });

  it("offers nothing on a day before the first period", () => {
    expect(surveyFormStart(PERIODS, [], "2025-07-31").choices).toEqual([]);
  });
});

describe("typedFeedbackWeight", () => {
  it.each([
    ["50", "50"],
    ["0", "100"],
    ["100", "0"],
    ["35", "65"],
  ])("shows the rest of 100 for %s", (typed, rest) => {
    expect(typedFeedbackWeight(typed)).toBe(rest);
  });

  it.each(["", "101", "-5", "abc", "12,5"])(
    "shows nothing while the first weight is '%s'",
    (typed) => {
      expect(typedFeedbackWeight(typed)).toBe("");
    },
  );
});

describe("openAgainQuestion", () => {
  it("asks before a Periode is opened again, naming it", () => {
    expect(openAgainQuestion("Genap 2025/2026")).toBe(
      "Periode Genap 2025/2026 sudah pernah dibuka. Buka lagi sebagai periode baru?",
    );
  });
});
