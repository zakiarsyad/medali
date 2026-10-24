import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast";

describe("contrastRatio", () => {
  it("is 21 for black on white and 1 for a colour on itself", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#13264a", "#13264a")).toBe(1);
  });

  it("is the same whichever colour comes first", () => {
    expect(contrastRatio("#ffffff", "#767676")).toBeCloseTo(4.54, 2);
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
  });

  it("refuses a colour that is not six digit hex", () => {
    expect(() => contrastRatio("var(--ink)", "#ffffff")).toThrow();
  });
});
