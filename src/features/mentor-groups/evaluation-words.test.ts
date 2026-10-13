import { describe, expect, it } from "vitest";
import { poorSaveWords, resultWords, savedWords } from "./evaluation-words";

function scoresOf(each: number) {
  return {
    activity: each,
    attendance: each,
    achievement: each,
    feedback: each,
  };
}

describe("poorSaveWords", () => {
  it("says what the save said when the stored evaluation is Kurang", () => {
    expect(poorSaveWords("Hendra Wijaya", [scoresOf(64)])).toBe(
      "Evaluasi Hendra Wijaya disimpan: Kurang.",
    );
  });

  it("says nothing when the stored evaluation is not Kurang", () => {
    expect(poorSaveWords("Hendra Wijaya", [scoresOf(65)])).toBeNull();
  });

  it("says nothing when nothing is stored for the period the address names", () => {
    expect(poorSaveWords("Hendra Wijaya", [])).toBeNull();
  });
});

describe("savedWords", () => {
  it("names the mentor and the result", () => {
    expect(savedWords({ mentorName: "Hendra Wijaya", result: "good" })).toBe(
      "Evaluasi Hendra Wijaya disimpan: Baik.",
    );
    expect(savedWords({ mentorName: "Hendra Wijaya", result: "poor" })).toBe(
      "Evaluasi Hendra Wijaya disimpan: Kurang.",
    );
  });
});

describe("resultWords", () => {
  it("writes the result with the average it was judged by", () => {
    expect(
      resultWords({
        activity: 80,
        attendance: 80,
        achievement: 80,
        feedback: 79,
      }),
    ).toBe("Cukup · 79,8");
    expect(
      resultWords({
        activity: 80,
        attendance: 80,
        achievement: 80,
        feedback: 80,
      }),
    ).toBe("Baik · 80,0");
  });
});
