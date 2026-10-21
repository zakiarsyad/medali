import { describe, expect, it } from "vitest";
import { foundWords } from "./found-words";

describe("foundWords", () => {
  it("speaks of the active students without a filter", () => {
    expect(foundWords(0)).toBe("mahasiswa aktif");
  });

  it("says how many filters the students match", () => {
    expect(foundWords(2)).toBe("mahasiswa sesuai 2 filter");
  });
});
