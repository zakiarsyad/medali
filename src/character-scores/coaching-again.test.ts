import { describe, expect, it } from "vitest";
import type { Scores } from "./assessment-score";
import { isIdentifiedAgain } from "./coaching-again";

const LISTED: Scores = { M: 55, E: 58, D: 60, A: 57, L: 59, I: 61 };
const ALSO_LISTED: Scores = { M: 70, E: 72, D: 56, A: 75, L: 74, I: 73 };
const NOT_LISTED: Scores = { M: 66, E: 70, D: 58, A: 72, L: 68, I: 71 };

describe("whether a new assessment identifies a student again", () => {
  it("is so when it lists a student the one before did not", () => {
    expect(isIdentifiedAgain(LISTED, NOT_LISTED)).toBe(true);
  });

  it("is not so when the one before listed them too, whatever the level", () => {
    expect(isIdentifiedAgain(ALSO_LISTED, LISTED)).toBe(false);
  });

  it("is not so when the new one does not list them", () => {
    expect(isIdentifiedAgain(NOT_LISTED, LISTED)).toBe(false);
    expect(isIdentifiedAgain(NOT_LISTED, NOT_LISTED)).toBe(false);
  });

  it("is so for a student listed by their first assessment", () => {
    expect(isIdentifiedAgain(LISTED, null)).toBe(true);
  });
});
