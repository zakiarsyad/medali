import { describe, expect, it } from "vitest";
import { categoryOf } from "./fitness-category";
import { STARTING_LIMITS } from "./fitness-ids";
import { finalCategory, suggestedCategory } from "./health-category";
import { ILLNESSES } from "./health-ids";

function testOf(score: number) {
  return categoryOf(score, STARTING_LIMITS);
}

describe("finalCategory", () => {
  it("takes a note's Perlu perhatian over a test of 88 (Prima), marked as from the note", () => {
    expect(finalCategory(testOf(88), "attention")).toEqual({
      category: "attention",
      fromNote: true,
    });
  });

  it("keeps a test of 50 at Perlu tindak lanjut medis when the note says Baik", () => {
    expect(finalCategory(testOf(50), "good")).toEqual({
      category: "medical",
      fromNote: false,
    });
  });

  it("takes a note's Perlu perhatian when there is no test, marked as from the note", () => {
    expect(finalCategory(null, "attention")).toEqual({
      category: "attention",
      fromNote: true,
    });
  });

  it("follows the test when the note follows it", () => {
    expect(finalCategory(testOf(72), null)).toEqual({
      category: "good",
      fromNote: false,
    });
  });

  it("keeps the test's category, unmarked, when the note says the same", () => {
    expect(finalCategory(testOf(60), "attention")).toEqual({
      category: "attention",
      fromNote: false,
    });
  });

  it("is Belum dites only with neither a test nor a note's category", () => {
    expect(finalCategory(null, null)).toEqual({
      category: "untested",
      fromNote: false,
    });
  });
});

describe("suggestedCategory", () => {
  it.each([
    "heart_disease",
    "epilepsy",
    "diabetes",
    "infectious_disease",
  ] as const)("suggests Perlu tindak lanjut medis for %s", (illness) => {
    expect(suggestedCategory([illness])).toBe("medical");
  });

  it.each([
    "asthma",
    "hypertension",
    "bone_joint_injury",
    "gastric_disorder",
  ] as const)("suggests Perlu perhatian for %s", (illness) => {
    expect(suggestedCategory([illness])).toBe("attention");
  });

  it("suggests the most serious of the illnesses picked", () => {
    expect(suggestedCategory(["asthma", "epilepsy", "allergy"])).toBe(
      "medical",
    );
  });

  it.each([[[]], [["allergy"]], [["other"]], [["allergy", "other"]]] as const)(
    "follows the fitness test for %j",
    (illnesses) => {
      expect(suggestedCategory(illnesses)).toBeNull();
    },
  );

  it("names a suggestion for every illness but Alergi and Lainnya", () => {
    const suggesting = ILLNESSES.filter(
      (illness) => suggestedCategory([illness]) !== null,
    );
    expect(suggesting).toHaveLength(8);
  });
});
