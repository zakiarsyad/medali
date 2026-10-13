import { describe, expect, it } from "vitest";
import { resultWords, savedWords } from "./evaluation-words";

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
