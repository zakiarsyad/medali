import { describe, expect, it } from "vitest";
import { isHeldWithin, sikuAfter, sikuOf } from "./siku-score";

describe("sikuOf", () => {
  it("is Nilai dasar plus the gains minus the losses", () => {
    expect(sikuOf(65, { gains: 7, losses: 3 })).toBe(69);
  });

  it("is Nilai dasar for a student with no gain and no loss", () => {
    expect(sikuOf(65, { gains: 0, losses: 0 })).toBe(65);
  });

  it("stops at 100", () => {
    expect(sikuOf(90, { gains: 30, losses: 5 })).toBe(100);
  });

  it("stops at 0", () => {
    expect(sikuOf(65, { gains: 0, losses: 66 })).toBe(0);
  });

  it("follows a new Nilai dasar for the same gains and losses", () => {
    const totals = { gains: 4, losses: 2 };

    expect(sikuOf(65, totals)).toBe(67);
    expect(sikuOf(70, totals)).toBe(72);
  });
});

describe("isHeldWithin", () => {
  it("says when the sum was held within 0 to 100", () => {
    expect(isHeldWithin(65, { gains: 0, losses: 66 })).toBe(true);
    expect(isHeldWithin(90, { gains: 11, losses: 0 })).toBe(true);
  });

  it("says no when the sum lies within 0 to 100, its ends among them", () => {
    expect(isHeldWithin(65, { gains: 35, losses: 0 })).toBe(false);
    expect(isHeldWithin(65, { gains: 0, losses: 65 })).toBe(false);
    expect(isHeldWithin(65, { gains: 2, losses: 3 })).toBe(false);
  });
});

describe("sikuAfter", () => {
  it("adds a gain to the totals, not to the SIKU already held at 0", () => {
    const totals = { gains: 0, losses: 70 };

    expect(sikuOf(65, totals)).toBe(0);
    expect(sikuAfter(65, totals, "gain", 3)).toBe(0);
    expect(sikuAfter(65, totals, "gain", 10)).toBe(5);
  });

  it("takes a loss away, and stops at 0", () => {
    expect(sikuAfter(65, { gains: 2, losses: 0 }, "loss", 3)).toBe(64);
    expect(sikuAfter(10, { gains: 0, losses: 0 }, "loss", 30)).toBe(0);
  });
});
