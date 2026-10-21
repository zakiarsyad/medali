import { describe, expect, it } from "vitest";
import {
  CHARACTER_SCORE_CAP,
  PENALTY_RULES,
  rankOf,
  ruleOf,
  socialWorkEnd,
  statusOf,
} from "./penalty-rules";

describe("the rules of the nine Jenjang", () => {
  it("hold three Jenjang for each Kategori, in order, with the prototype's penalties and legal basis", () => {
    expect(PENALTY_RULES).toHaveLength(9);
    expect(
      PENALTY_RULES.map((rule) => [rule.category, rule.level, rule.basis]),
    ).toEqual([
      ["light", 1, "ayat (2) huruf a"],
      ["light", 2, "ayat (2) huruf b"],
      ["light", 3, "ayat (2) huruf c"],
      ["medium", 1, "ayat (3) huruf a"],
      ["medium", 2, "ayat (3) huruf b"],
      ["medium", 3, "ayat (3) huruf c"],
      ["heavy", 1, "ayat (4) huruf a"],
      ["heavy", 2, "ayat (4) huruf b"],
      ["heavy", 3, "ayat (4) huruf c"],
    ]);
    expect(ruleOf("light", 1).penalty).toBe("Teguran lisan tertulis");
    expect(ruleOf("medium", 3).penalty).toBe("Peringatan kedua tertulis");
    expect(ruleOf("heavy", 3).penalty).toBe(
      "Diberhentikan dengan tidak hormat secara permanen",
    );
  });

  it("give kerja sosial in days for Ringan and Sedang, 8 months for Berat jenjang pertama, and none for the other two Berat", () => {
    expect(PENALTY_RULES.map((rule) => rule.socialWork)).toEqual([
      { amount: 7, unit: "day" },
      { amount: 10, unit: "day" },
      { amount: 15, unit: "day" },
      { amount: 20, unit: "day" },
      { amount: 30, unit: "day" },
      { amount: 60, unit: "day" },
      { amount: 8, unit: "month" },
      null,
      null,
    ]);
  });

  it("cap nilai karakter at 70 for Ringan and Sedang, suspend for Berat jenjang pertama, and end the status for the other two", () => {
    expect(CHARACTER_SCORE_CAP).toBe(70);
    expect(PENALTY_RULES.map((rule) => rule.outcome)).toEqual([
      "capped",
      "capped",
      "capped",
      "capped",
      "capped",
      "capped",
      "suspended",
      "dismissed",
      "dismissed",
    ]);
  });

  it("make a penalty that ends the status Ditetapkan, and every other Dijatuhkan", () => {
    expect(statusOf(ruleOf("heavy", 2))).toBe("set");
    expect(statusOf(ruleOf("heavy", 3))).toBe("set");
    expect(statusOf(ruleOf("heavy", 1))).toBe("imposed");
    expect(statusOf(ruleOf("light", 1))).toBe("imposed");
  });

  it("rank the Jenjang from Ringan pertama to Berat ketiga", () => {
    expect(rankOf("light", 1)).toBe(0);
    expect(rankOf("light", 3)).toBeLessThan(rankOf("medium", 1));
    expect(rankOf("heavy", 3)).toBe(8);
  });
});

describe("socialWorkEnd", () => {
  it("counts the first day as one of the days", () => {
    expect(socialWorkEnd("2026-10-01", { amount: 7, unit: "day" })).toBe(
      "2026-10-07",
    );
    expect(socialWorkEnd("2026-12-28", { amount: 10, unit: "day" })).toBe(
      "2027-01-06",
    );
  });

  it("ends months the day before the same day of the last month", () => {
    expect(socialWorkEnd("2026-01-15", { amount: 8, unit: "month" })).toBe(
      "2026-09-14",
    );
    expect(socialWorkEnd("2026-08-01", { amount: 8, unit: "month" })).toBe(
      "2027-03-31",
    );
  });

  it("keeps a month that is too short for the day within that month", () => {
    expect(socialWorkEnd("2026-06-30", { amount: 8, unit: "month" })).toBe(
      "2027-02-27",
    );
  });
});
