import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ScoreHistoryView } from "./score-history-view";
import type { SemesterPoint } from "./semester-points";

const FIRST: SemesterPoint = {
  semester: 1,
  periodTitle: "Ganjil 2025/2026",
  scores: { M: 60, E: 55, D: 70, A: 62, L: 64, I: 68 },
  rerata: 63.2,
};

const SECOND: SemesterPoint = {
  semester: 2,
  periodTitle: "Genap 2025/2026",
  scores: { M: 80, E: 78, D: 84, A: 72, L: 82, I: 86 },
  rerata: 80.3,
};

const THIRD: SemesterPoint = {
  semester: 3,
  periodTitle: "Ganjil 2026/2027",
  scores: { M: 90, E: 88, D: 86, A: 85, L: 92, I: 89 },
  rerata: 88.3,
};

function viewOf(points: SemesterPoint[]): string {
  return renderToStaticMarkup(<ScoreHistoryView points={points} />);
}

function countOf(html: string, part: RegExp): number {
  return html.match(part)?.length ?? 0;
}

describe("Riwayat per semester in a student's detail", () => {
  it("names the panel and shows the legend of Rerata and the six values", () => {
    const html = viewOf([FIRST, SECOND]);

    expect(html).toContain(">Riwayat per semester</h2>");
    for (const word of ["Rerata", "M", "E", "D", "A", "L", "I"]) {
      expect(html).toMatch(new RegExp(`</i>${word}</li>`));
    }
  });

  it("draws a line for Rerata and for each value, a point per semester, named Smt n", () => {
    const html = viewOf([FIRST, SECOND, THIRD]);

    expect(html).toContain('role="img"');
    expect(html).toContain(
      'aria-label="Grafik riwayat nilai MEDALI per semester: Smt 1 Rerata 63,2, Smt 2 Rerata 80,3, Smt 3 Rerata 88,3"',
    );
    expect(countOf(html, /<path /g)).toBe(7);
    expect(
      countOf(html, /<path [^>]*d="M[\d.]+ [\d.]+ L[\d.]+ [\d.]+ L/g),
    ).toBe(7);
    for (const label of [">Smt 1<", ">Smt 2<", ">Smt 3<"]) {
      expect(html).toContain(label);
    }
    for (const score of [">50<", ">65<", ">75<", ">85<", ">100<"]) {
      expect(html).toContain(score);
    }
  });

  it("draws one visible point for each line of a single assessed semester", () => {
    const html = viewOf([THIRD]);

    expect(html).toContain(">Smt 3<");
    expect(html).not.toContain("setelah semester kedua");
    expect(countOf(html, /<circle /g)).toBe(7);
  });

  it("says so for a student never assessed, with no chart, legend or table", () => {
    const html = viewOf([]);

    expect(html).toContain(">Riwayat per semester</h2>");
    expect(html).toContain("Belum ada riwayat.");
    expect(html).not.toContain("<svg");
    expect(html).not.toContain("<table");
    expect(html).not.toContain("Rerata");
  });

  it("puts the same numbers in a table under the chart, each semester with its period", () => {
    const html = viewOf([FIRST, THIRD]);

    expect(html).toContain("<th>Semester</th><th>Rerata</th>");
    expect(html).toContain("Smt 1 · Ganjil 2025/2026");
    expect(html).toContain("Smt 3 · Ganjil 2026/2027");
    expect(html).toContain('<td data-title="Rerata">63,2</td>');
    expect(html).toContain('<td data-title="Mandiri">60</td>');
    expect(html).toContain('<td data-title="Integritas">89</td>');
    expect(html.indexOf("Smt 1 · ")).toBeLessThan(html.indexOf("Smt 3 · "));
  });
});
