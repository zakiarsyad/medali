import { describe, expect, it } from "vitest";
import { readyLine } from "./fitness-words";

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
