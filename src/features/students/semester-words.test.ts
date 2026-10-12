import { describe, expect, it } from "vitest";
import { rowSemesterWords } from "./semester-words";

describe("rowSemesterWords", () => {
  it("says the semester, the tahap and the kelas", () => {
    expect(rowSemesterWords(3, "2-01")).toBe("Smt 3 · Penumbuhan · 2-01");
  });

  it("leaves out a kelas that is not kept", () => {
    expect(rowSemesterWords(8, null)).toBe("Smt 8 · Pematangan");
  });

  it("says only the kelas when no semester is known", () => {
    expect(rowSemesterWords(null, "2-01")).toBe("2-01");
    expect(rowSemesterWords(null, null)).toBe("");
  });
});
