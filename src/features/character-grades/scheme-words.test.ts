import { describe, expect, it } from "vitest";
import { weightTotal } from "@/character-grades/grade-letter";
import { STARTING_SCHEME } from "@/character-grades/scheme-ids";
import {
  barCells,
  formulaSentence,
  schemeNote,
  shownWeights,
} from "./scheme-words";

describe("formulaSentence", () => {
  it("fills in the weights of the starting scheme", () => {
    expect(formulaSentence(STARTING_SCHEME.weights)).toBe(
      "Nilai akhir = 25% × kehadiran kegiatan + 25% × pengasuhan + 25% × sikap dan perilaku (SIKU) + 25% × SKPM.",
    );
  });

  it("follows other weights, 0 among them", () => {
    expect(
      formulaSentence({ attendance: 40, mentoring: 20, siku: 40, skpm: 0 }),
    ).toBe(
      "Nilai akhir = 40% × kehadiran kegiatan + 20% × pengasuhan + 40% × sikap dan perilaku (SIKU) + 0% × SKPM.",
    );
  });
});

describe("shownWeights", () => {
  it("counts a weight that is not a number as 0", () => {
    expect(
      shownWeights({ attendance: "40", mentoring: "", siku: "x", skpm: "20" }),
    ).toEqual({ attendance: 40, mentoring: 0, siku: 0, skpm: 20 });
  });
});

describe("schemeNote", () => {
  it("says the starting scheme is not fitted to KEP-220 yet", () => {
    expect(schemeNote(null)).toBe(
      "Bobot awal belum disesuaikan dengan KEP-220.",
    );
  });

  it("says when and by whom the scheme was set, in campus time", () => {
    expect(
      schemeNote({ at: new Date("2026-10-15T18:00:00Z"), by: "Kepala Uji" }),
    ).toBe("Ditetapkan 16 Okt 2026 oleh Kepala Uji.");
  });
});

describe("barCells", () => {
  it("gives each part one cell per percent, in the order of the fields", () => {
    const cells = barCells({
      attendance: 40,
      mentoring: 20,
      siku: 20,
      skpm: 20,
    });

    expect(cells).toHaveLength(100);
    expect(cells.filter((cell) => cell === "attendance")).toHaveLength(40);
    expect(cells[0]).toBe("attendance");
    expect(cells[40]).toBe("mentoring");
    expect(cells[99]).toBe("skpm");
  });

  it("leaves the rest empty while the total is below 100", () => {
    const cells = barCells({
      attendance: 30,
      mentoring: 20,
      siku: 20,
      skpm: 20,
    });

    expect(cells).toHaveLength(100);
    expect(cells.filter((cell) => cell === "rest")).toHaveLength(10);
  });

  it("grows past 100 cells while the total is above 100", () => {
    const cells = barCells({
      attendance: 50,
      mentoring: 25,
      siku: 25,
      skpm: 25,
    });

    expect(cells).toHaveLength(125);
    expect(cells).not.toContain("rest");
  });
});

describe("the total, the bar and the sentence while the weights are typed", () => {
  it.each([
    ["15", 90, "15% × kehadiran kegiatan"],
    ["35", 110, "35% × kehadiran kegiatan"],
  ])(
    "follow a Kehadiran kegiatan of %s at once, to a total of %s",
    (attendance, total, term) => {
      const weights = shownWeights({
        attendance,
        mentoring: "25",
        siku: "25",
        skpm: "25",
      });

      expect(weightTotal(weights)).toBe(total);
      expect(barCells(weights)).toHaveLength(Math.max(total, 100));
      expect(formulaSentence(weights)).toContain(term);
    },
  );
});
