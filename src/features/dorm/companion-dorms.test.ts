import { describe, expect, it } from "vitest";
import { companionDormOf, hasCompanions } from "./companion-dorms";

describe("companionDormOf", () => {
  it("gives Cipta Bakti for a woman", () => {
    expect(companionDormOf("female")).toBe("cipta_bakti");
  });

  it("gives Dana Rakca for a man", () => {
    expect(companionDormOf("male")).toBe("dana_rakca");
  });
});

describe("hasCompanions", () => {
  it.each(["dana_rakca", "cipta_bakti"] as const)("is yes for %s", (dorm) => {
    expect(hasCompanions(dorm)).toBe(true);
  });

  it.each(["wismantara_putra", "wismantara_putri"] as const)(
    "is no for %s",
    (dorm) => {
      expect(hasCompanions(dorm)).toBe(false);
    },
  );
});
