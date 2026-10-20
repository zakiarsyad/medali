import { describe, expect, it } from "vitest";
import {
  filledMark,
  NO_MARK,
  parseMark,
  sameMark,
} from "./mental-health-mark-input";
import {
  OBSERVATION_TOO_LONG,
  REFERRAL_NEEDS_OBSERVATION,
  UNKNOWN_MARK,
} from "./mental-health-mark-words";

/** The parts of a sent mark that say what the form was filled with. */
const FILLED_NONE = { filledCategory: "", filledObservation: "" };

describe("parseMark", () => {
  it("keeps a mark with its observation, trimmed", () => {
    expect(
      parseMark({
        ...FILLED_NONE,
        category: "monitor",
        observation: "  Sulit tidur.  ",
      }),
    ).toEqual({
      ok: true,
      value: { category: "monitor", observation: "Sulit tidur." },
    });
  });

  it("keeps a mark to watch with no observation", () => {
    expect(
      parseMark({ ...FILLED_NONE, category: "monitor", observation: " " }),
    ).toEqual({
      ok: true,
      value: { category: "monitor", observation: "" },
    });
  });

  it("takes Tidak ada indikasi as no mark, and drops its observation", () => {
    expect(
      parseMark({ ...FILLED_NONE, category: "", observation: "Sulit tidur." }),
    ).toEqual({
      ok: true,
      value: NO_MARK,
    });
  });

  it("refuses a referral to the counsellor with no observation", () => {
    expect(
      parseMark({ ...FILLED_NONE, category: "refer", observation: "  " }),
    ).toEqual({
      ok: false,
      error: REFERRAL_NEEDS_OBSERVATION,
    });
    expect(REFERRAL_NEEDS_OBSERVATION).toBe(
      "Isi pengamatan untuk rujukan ke konselor.",
    );
  });

  it("refuses a category the form does not offer", () => {
    expect(
      parseMark({ ...FILLED_NONE, category: "diagnosis", observation: "" }),
    ).toEqual({
      ok: false,
      error: UNKNOWN_MARK,
    });
  });

  it("keeps an observation of 500 characters and refuses a longer one", () => {
    const most = "a".repeat(500);
    expect(
      parseMark({ ...FILLED_NONE, category: "refer", observation: most }).ok,
    ).toBe(true);
    expect(
      parseMark({ ...FILLED_NONE, category: "refer", observation: `${most}a` }),
    ).toEqual({
      ok: false,
      error: OBSERVATION_TOO_LONG,
    });
  });
});

describe("sameMark", () => {
  it("is true only for the same category and observation", () => {
    const mark = { category: "monitor", observation: "Sulit tidur." } as const;
    expect(sameMark(mark, { ...mark })).toBe(true);
    expect(sameMark(mark, { ...mark, category: "refer" })).toBe(false);
    expect(sameMark(mark, { ...mark, observation: "Menangis." })).toBe(false);
    expect(sameMark(NO_MARK, { category: null, observation: "" })).toBe(true);
  });
});

describe("filledMark", () => {
  const typed = { category: "refer", observation: "Menarik diri." };

  it("reads the mark the form was filled with", () => {
    expect(filledMark({ ...typed, ...FILLED_NONE })).toEqual(NO_MARK);
    expect(
      filledMark({
        ...typed,
        filledCategory: "monitor",
        filledObservation: " Sulit tidur. ",
      }),
    ).toEqual({ category: "monitor", observation: "Sulit tidur." });
  });

  it("is null for a category the form does not offer", () => {
    expect(
      filledMark({ ...typed, filledCategory: "x", filledObservation: "" }),
    ).toBeNull();
  });
});
