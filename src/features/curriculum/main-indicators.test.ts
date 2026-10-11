import { describe, expect, it } from "vitest";
import { mainIndicators } from "./main-indicators";

describe("mainIndicators", () => {
  const starting = mainIndicators(new Map());

  it("gives the six values in the order of the word MEDALI", () => {
    expect(starting.map((value) => value.name)).toEqual([
      "Mandiri",
      "Empati",
      "Disiplin",
      "Adaptif",
      "Loyal",
      "Integritas",
    ]);
  });

  it("gives each value four indicators with a code, a level and a tahap", () => {
    for (const value of starting) {
      expect(value.indicators.map(({ code }) => code)).toEqual(
        [1, 2, 3, 4].map((level) => `${value.key}${level}`),
      );
      expect(value.indicators.map(({ level }) => level)).toEqual([1, 2, 3, 4]);
      expect(value.indicators.map(({ stage }) => stage)).toEqual([
        "Penanaman",
        "Penumbuhan",
        "Pengembangan",
        "Pematangan",
      ]);
    }
  });

  it("starts every indicator with a text of its own", () => {
    const texts = starting.flatMap((value) =>
      value.indicators.map(({ text }) => text),
    );
    expect(texts).toHaveLength(24);
    expect(new Set(texts).size).toBe(24);
    expect(texts.every((text) => text.trim() !== "")).toBe(true);
    expect(texts[0]).toBe(
      "Mengatur waktu, keuangan, dan kebutuhan pribadi secara mandiri",
    );
    expect(texts[23]).toBe(
      "Berintegritas dan antikorupsi sebagai calon aparatur negara",
    );
  });

  it("shows a saved text in place of the starting one, and keeps the rest", () => {
    const shown = mainIndicators(new Map([["D2", "Teks uji"]]));
    const discipline = shown.find((value) => value.key === "D");

    expect(discipline?.indicators[1]?.text).toBe("Teks uji");
    expect(discipline?.indicators[0]?.text).toBe(
      "Tepat waktu serta taat tata tertib kampus dan asrama",
    );
  });
});
