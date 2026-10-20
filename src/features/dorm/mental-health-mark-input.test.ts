import { describe, expect, it } from "vitest";
import { NO_MARK, parseMark, sameMark } from "./mental-health-mark-input";
import {
  OBSERVATION_TOO_LONG,
  REFERRAL_NEEDS_OBSERVATION,
  UNKNOWN_MARK,
} from "./mental-health-mark-words";

describe("parseMark", () => {
  it("keeps a mark with its observation, trimmed", () => {
    expect(
      parseMark({ category: "monitor", observation: "  Sulit tidur.  " }),
    ).toEqual({
      ok: true,
      value: { category: "monitor", observation: "Sulit tidur." },
    });
  });

  it("keeps a mark to watch with no observation", () => {
    expect(parseMark({ category: "monitor", observation: " " })).toEqual({
      ok: true,
      value: { category: "monitor", observation: "" },
    });
  });

  it("takes Tidak ada indikasi as no mark, and drops its observation", () => {
    expect(parseMark({ category: "", observation: "Sulit tidur." })).toEqual({
      ok: true,
      value: NO_MARK,
    });
  });

  it("refuses a referral to the counsellor with no observation", () => {
    expect(parseMark({ category: "refer", observation: "  " })).toEqual({
      ok: false,
      error: REFERRAL_NEEDS_OBSERVATION,
    });
    expect(REFERRAL_NEEDS_OBSERVATION).toBe(
      "Isi pengamatan untuk rujukan ke konselor.",
    );
  });

  it("refuses a category the form does not offer", () => {
    expect(parseMark({ category: "diagnosis", observation: "" })).toEqual({
      ok: false,
      error: UNKNOWN_MARK,
    });
  });

  it("keeps an observation of 500 characters and refuses a longer one", () => {
    const most = "a".repeat(500);
    expect(parseMark({ category: "refer", observation: most }).ok).toBe(true);
    expect(parseMark({ category: "refer", observation: `${most}a` })).toEqual({
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
