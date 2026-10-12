import { describe, expect, it } from "vitest";
import { companionDormOf, hasCompanions } from "./companion-dorms";

describe("companionDormOf", () => {
  it("gives Dana Rakca for a woman", () => {
    expect(companionDormOf("female")).toBe("dana_rakca");
  });

  it("gives Cipta Bakti for a man", () => {
    expect(companionDormOf("male")).toBe("cipta_bakti");
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
