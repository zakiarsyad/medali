import { describe, expect, it } from "vitest";
import {
  NO_RESULT_CHOICES,
  readSurveyResultParams,
  type SurveyResultChoices,
  surveyResultsAddress,
} from "./survey-results-address";

const ID = "6f1c2c1e-6c55-4a3e-9d0b-2c1b4c7d8e9f";
const GROUP = "0d6c4c55-1a2b-4c3d-8e9f-0a1b2c3d4e5f";
const MENTOR = "1e7d5d66-2b3c-4d4e-9f0a-1b2c3d4e5f60";

describe("readSurveyResultParams", () => {
  it("reads the period, the search, the filter, the page and the row whose detail is open", () => {
    expect(
      readSurveyResultParams({
        periode: ID,
        q: "  pajak ",
        saring: "kurang",
        hal: "2",
        kelompok: GROUP,
        pengasuh: MENTOR,
      }),
    ).toEqual({
      surveyPeriodId: ID,
      query: "pajak",
      filter: "poor",
      page: 2,
      opened: { groupId: GROUP, mentorId: MENTOR },
    });
  });

  it("reads Belum ada responden", () => {
    expect(readSurveyResultParams({ saring: "belum" }).filter).toBe(
      "no_answers",
    );
  });

  it("opens the row of a group without a mentor", () => {
    expect(readSurveyResultParams({ kelompok: GROUP }).opened).toEqual({
      groupId: GROUP,
      mentorId: null,
    });
  });

  it("counts what it does not understand as not chosen", () => {
    expect(
      readSurveyResultParams({
        periode: "  ",
        q: "x".repeat(101),
        saring: "semua",
        hal: "0",
        pengasuh: MENTOR,
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
  const chosen: SurveyResultChoices = {
    surveyPeriodId: ID,
    query: "pajak",
    filter: "poor",
    page: 1,
    opened: null,
  };

  it("is the tab alone when nothing is chosen", () => {
    expect(surveyResultsAddress(NO_RESULT_CHOICES)).toBe("/pengasuh/survei");
  });

  it("keeps what is chosen, and leaves out the first page", () => {
    expect(surveyResultsAddress(chosen)).toBe(
      `/pengasuh/survei?periode=${ID}&q=pajak&saring=kurang`,
    );
    expect(surveyResultsAddress({ ...chosen, filter: "no_answers" }, 3)).toBe(
      `/pengasuh/survei?periode=${ID}&q=pajak&saring=belum&hal=3`,
    );
  });

  it("names the row whose detail opens, and only when asked", () => {
    const opened = { groupId: GROUP, mentorId: MENTOR };

    expect(surveyResultsAddress(chosen, 1, opened)).toBe(
      `/pengasuh/survei?periode=${ID}&q=pajak&saring=kurang&kelompok=${GROUP}&pengasuh=${MENTOR}`,
    );
    expect(surveyResultsAddress({ ...chosen, opened })).not.toContain(
      "kelompok",
    );
  });

  it("reads back what it wrote", () => {
    const back: SurveyResultChoices = {
      surveyPeriodId: ID,
      query: "KP 2025",
      filter: "no_answers",
      page: 2,
      opened: { groupId: GROUP, mentorId: null },
    };
    const address = surveyResultsAddress(back, 2, back.opened);
    const params = Object.fromEntries(
      new URLSearchParams(address.split("?")[1]),
    );

    expect(readSurveyResultParams(params)).toEqual(back);
  });
});
