import { describe, expect, it } from "vitest";
import { detailSemesterWords, rowSemesterWords } from "./semester-words";

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

describe("detailSemesterWords", () => {
  it("says the semester, the tahap and the tingkat", () => {
    expect(detailSemesterWords("active", 1)).toBe(
      "Semester 1 · Tahap Penanaman (tingkat 1)",
    );
    expect(detailSemesterWords("on_leave", 6)).toBe(
      "Semester 6 · Tahap Pengembangan (tingkat 3)",
    );
  });

  it("says a Non aktif student is not active", () => {
    expect(detailSemesterWords("inactive", null)).toBe("Tidak aktif");
  });

  it("says a dash while no period runs", () => {
    expect(detailSemesterWords("active", null)).toBe("-");
    expect(detailSemesterWords("on_leave", null)).toBe("-");
  });
});
