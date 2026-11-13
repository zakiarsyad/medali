import { describe, expect, it } from "vitest";
import { rangeWords } from "./category-words";
import { categoryRange } from "./fitness-category";
import { STARTING_LIMITS } from "./fitness-ids";

describe("rangeWords", () => {
  it.each([
    ["excellent", "85–100"],
    ["good", "70–84,99"],
    ["attention", "55–69,99"],
    ["medical", "0–54,99"],
  ] as const)("writes the scores of %s as %s", (category, words) => {
    expect(rangeWords(categoryRange(category, STARTING_LIMITS))).toBe(words);
  });
});
