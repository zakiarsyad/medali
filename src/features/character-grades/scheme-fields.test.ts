import { describe, expect, it } from "vitest";
import { STARTING_SCHEME } from "@/character-grades/scheme-ids";
import { sentSchemeOf, typedOf, weightField } from "./scheme-fields";

describe("typedOf", () => {
  it("shows each number of the scheme as text", () => {
    expect(typedOf(STARTING_SCHEME)).toEqual({
      weights: { attendance: "25", mentoring: "25", siku: "25", skpm: "25" },
      lowerLimits: { A: "85", B: "70", C: "60", D: "50" },
      passLetter: "B",
    });
  });
});

describe("sentSchemeOf", () => {
  it("reads each field by its name", () => {
    const sent = new Map([
      [weightField("attendance"), "40"],
      ["weight_mentoring", "20"],
      ["weight_siku", "20"],
      ["weight_skpm", "20"],
      ["limit_A", "90"],
      ["limit_B", "80"],
      ["limit_C", "70"],
      ["limit_D", "60"],
      ["passLetter", "C"],
    ]);

    expect(sentSchemeOf((name) => sent.get(name) ?? "")).toEqual({
      weights: { attendance: "40", mentoring: "20", siku: "20", skpm: "20" },
      lowerLimits: { A: "90", B: "80", C: "70", D: "60" },
      passLetter: "C",
    });
  });
});
