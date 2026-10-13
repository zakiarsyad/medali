import { describe, expect, it } from "vitest";
import { typedFor } from "./evaluation-form-start";

const STORED = [
  {
    periodId: "berjalan",
    activity: 80,
    attendance: 0,
    achievement: 70,
    feedback: 100,
    note: "Rutin mendampingi.",
  },
  {
    periodId: "sebelumnya",
    activity: 60,
    attendance: 60,
    achievement: 60,
    feedback: 60,
    note: null,
  },
];

describe("typedFor", () => {
  it("starts empty for a period without an evaluation", () => {
    expect(typedFor(STORED, "lain")).toEqual({
      scores: { activity: "", attendance: "", achievement: "", feedback: "" },
      note: "",
    });
    expect(typedFor([], "berjalan").note).toBe("");
  });

  it("starts from what is saved for the period, a zero included", () => {
    expect(typedFor(STORED, "berjalan")).toEqual({
      scores: {
        activity: "80",
        attendance: "0",
        achievement: "70",
        feedback: "100",
      },
      note: "Rutin mendampingi.",
    });
  });

  it("starts with an empty note where none is saved", () => {
    expect(typedFor(STORED, "sebelumnya").note).toBe("");
  });
});
