import { describe, expect, it } from "vitest";
import { readyLine, shownScore } from "./fitness-words";

describe("shownScore", () => {
  it.each([
    [85.25, "85,25"],
    [72.5, "72,50"],
    [80, "80,00"],
    [0, "0,00"],
    [100, "100,00"],
    [84.99, "84,99"],
  ])("writes %d with two decimals as %s", (score, shown) => {
    expect(shownScore(score)).toBe(shown);
  });

  it("writes - for no score", () => {
    expect(shownScore(null)).toBe("-");
  });
});

describe("readyLine", () => {
  it.each([
    [1, "1 skor siap disimpan."],
    [3, "3 skor siap disimpan."],
  ])("counts %i filled field(s)", (filled, line) => {
    expect(readyLine(filled)).toBe(line);
  });

  it("says empty fields are skipped while none is filled", () => {
    expect(readyLine(0)).toBe("Isi skor yang tersedia; kolom kosong dilewati.");
  });
});
