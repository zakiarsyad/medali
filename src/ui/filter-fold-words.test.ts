import { describe, expect, it } from "vitest";
import { filterFoldWords } from "./filter-fold-words";

describe("filterFoldWords", () => {
  it("says only Filter while none is in use", () => {
    expect(filterFoldWords(0)).toBe("Filter");
  });

  it("says how many filters are in use", () => {
    expect(filterFoldWords(1)).toBe("Filter · 1 dipakai");
    expect(filterFoldWords(6)).toBe("Filter · 6 dipakai");
  });
});
