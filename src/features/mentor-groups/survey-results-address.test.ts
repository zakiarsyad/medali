import { describe, expect, it } from "vitest";
import {
  NO_RESULT_CHOICES,
  readSurveyResultParams,
  surveyResultsAddress,
} from "./survey-results-address";

const ID = "6f1c2c1e-6c55-4a3e-9d0b-2c1b4c7d8e9f";

describe("readSurveyResultParams", () => {
  it("reads the period, the search, the filter and the page", () => {
    expect(
      readSurveyResultParams({
        periode: ID,
        q: "  pajak ",
        saring: "kurang",
        hal: "2",
      }),
    ).toEqual({
      surveyPeriodId: ID,
      query: "pajak",
      filter: "poor",
      page: 2,
    });
  });

  it("reads Belum ada responden", () => {
    expect(readSurveyResultParams({ saring: "belum" }).filter).toBe(
      "no_answers",
    );
  });

  it("counts what it does not understand as not chosen", () => {
    expect(
      readSurveyResultParams({
        periode: "  ",
        q: "x".repeat(101),
        saring: "semua",
        hal: "0",
      }),
    ).toEqual(NO_RESULT_CHOICES);
    expect(readSurveyResultParams({ hal: "dua" }).page).toBe(1);
  });

  it("takes the first of a part given twice", () => {
    expect(readSurveyResultParams({ saring: ["belum", "kurang"] }).filter).toBe(
      "no_answers",
    );
  });
});

describe("surveyResultsAddress", () => {
  it("is the tab alone when nothing is chosen", () => {
    expect(surveyResultsAddress(NO_RESULT_CHOICES)).toBe("/pengasuh/survei");
  });

  it("keeps what is chosen, and leaves out the first page", () => {
    const chosen = {
      surveyPeriodId: ID,
      query: "pajak",
      filter: "poor",
      page: 1,
    } as const;

    expect(surveyResultsAddress(chosen)).toBe(
      `/pengasuh/survei?periode=${ID}&q=pajak&saring=kurang`,
    );
    expect(surveyResultsAddress({ ...chosen, filter: "no_answers" }, 3)).toBe(
      `/pengasuh/survei?periode=${ID}&q=pajak&saring=belum&hal=3`,
    );
  });

  it("reads back what it wrote", () => {
    const chosen = {
      surveyPeriodId: ID,
      query: "KP 2025",
      filter: "no_answers",
      page: 2,
    } as const;
    const address = surveyResultsAddress(chosen, 2);
    const params = Object.fromEntries(
      new URLSearchParams(address.split("?")[1]),
    );

    expect(readSurveyResultParams(params)).toEqual(chosen);
  });
});
