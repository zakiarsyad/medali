import { describe, expect, it } from "vitest";
import { semesterPointsOf } from "./semester-points";

const LOW = { M: 60, E: 55, D: 70, A: 62, L: 64, I: 68 };
const SILVER = { M: 80, E: 78, D: 84, A: 72, L: 82, I: 86 };
const GOLD = { M: 90, E: 88, D: 86, A: 85, L: 92, I: 89 };

describe("semesterPointsOf", () => {
  it("names each assessed period by the student's semester and its title, with the Rerata", () => {
    const points = semesterPointsOf(2025, [
      { startYear: 2026, term: "odd", scores: SILVER },
    ]);

    expect(points).toEqual([
      {
        semester: 3,
        periodTitle: "Ganjil 2026/2027",
        scores: SILVER,
        rerata: 80.3,
      },
    ]);
  });

  it("runs from the oldest period to the newest, Ganjil before Genap of one year", () => {
    const points = semesterPointsOf(2025, [
      { startYear: 2026, term: "odd", scores: GOLD },
      { startYear: 2025, term: "even", scores: SILVER },
      { startYear: 2025, term: "odd", scores: LOW },
    ]);

    expect(points.map((point) => point.periodTitle)).toEqual([
      "Ganjil 2025/2026",
      "Genap 2025/2026",
      "Ganjil 2026/2027",
    ]);
    expect(points.map((point) => point.semester)).toEqual([1, 2, 3]);
  });

  it("tells two periods past the eighth semester apart by their titles", () => {
    const points = semesterPointsOf(2020, [
      { startYear: 2025, term: "odd", scores: SILVER },
      { startYear: 2024, term: "even", scores: SILVER },
    ]);

    expect(points.map((point) => point.semester)).toEqual([8, 8]);
    expect(points.map((point) => point.periodTitle)).toEqual([
      "Genap 2024/2025",
      "Ganjil 2025/2026",
    ]);
  });

  it("gives no point for a student never assessed", () => {
    expect(semesterPointsOf(2025, [])).toEqual([]);
  });
});
