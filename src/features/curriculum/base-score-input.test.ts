import { describe, expect, it } from "vitest";
import { parseBaseScore } from "./base-score-input";

const REFUSED = { ok: false, error: "Nilai dasar harus 0–100." };

describe("parseBaseScore", () => {
  it.each([
    ["0", 0],
    ["65", 65],
    ["100", 100],
    [" 70 ", 70],
    ["007", 7],
  ])("takes %j as %i", (sent, score) => {
    expect(parseBaseScore(sent)).toEqual({ ok: true, value: score });
  });

  it.each([
    ["an empty field", ""],
    ["spaces only", "   "],
    ["a number below 0", "-1"],
    ["a number above 100", "101"],
    ["a number far above 100", "1000"],
    ["a number that is not whole", "65.5"],
    ["a number with a comma", "65,5"],
    ["a number written with e", "1e2"],
    ["words", "enam puluh"],
  ])("refuses %s", (_what, sent) => {
    expect(parseBaseScore(sent)).toEqual(REFUSED);
  });
});
