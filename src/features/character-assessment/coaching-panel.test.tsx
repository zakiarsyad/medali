import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { START_PARAMS } from "./assessment-address";
import type { CoachingList, CoachingRow } from "./coaching-list";
import { CoachingPanel, NO_COACHING } from "./coaching-panel";

const ANI: CoachingRow = {
  id: "00000000-0000-4000-8000-000000000501",
  name: "Ani Contoh",
  nim: "9986090001",
  program: "D3 Akuntansi",
  scores: { M: 55, E: 58, D: 60, A: 57, L: 59, I: 61 },
  need: { level: "intensive", weakest: "M" },
};

const BUDI: CoachingRow = {
  id: "00000000-0000-4000-8000-000000000502",
  name: "Budi Contoh",
  nim: "9986090002",
  program: "D3 Pajak",
  scores: { M: 70, E: 72, D: 56, A: 75, L: 74, I: 73 },
  need: { level: "light", weakest: "D" },
};

function listOf(more: Partial<CoachingList>): CoachingList {
  return { rows: [ANI, BUDI], matching: 2, page: 1, showsAll: false, ...more };
}

function panel(list: CoachingList, params = START_PARAMS): string {
  return renderToStaticMarkup(<CoachingPanel list={list} params={params} />);
}

describe("Teridentifikasi perlu pembinaan", () => {
  const html = panel(listOf({}));

  it("says who is listed, by the numbers of the rule", () => {
    expect(html).toContain("Teridentifikasi perlu pembinaan");
    expect(html).toContain("rerata di bawah 65 atau satu nilai di bawah 58");
  });

  it("shows the student, Tingkat, Rerata MEDALI and Aspek terlemah with its score", () => {
    expect(html).toContain("Ani Contoh");
    expect(html).toContain("9986090001 · D3 Akuntansi");
    expect(html).toContain("Intensif");
    expect(html).toContain("Ringan");
    expect(html).toContain("58,3");
    expect(html).toContain("70,0");
    expect(html).toMatch(/Mandiri\s*(<[^>]+>\s*)*55/);
    expect(html).toMatch(/Disiplin\s*(<[^>]+>\s*)*56/);
  });

  it("has no column Konseling", () => {
    expect(html).not.toContain("Konseling");
  });

  it("shows the column Konseling only when given what each row holds there", () => {
    const withCalls = renderToStaticMarkup(
      <CoachingPanel
        list={listOf({})}
        params={START_PARAMS}
        counsellingCell={(row) => <i>sel {row.nim}</i>}
      />,
    );

    expect(withCalls).toContain("<th>Konseling</th>");
    expect(withCalls).toContain(
      '<td data-title="Konseling"><i>sel 9986090002</i></td>',
    );
  });

  it("becomes cards on a phone", () => {
    expect(html).toMatch(/<table class="[^"]*stacked/);
    expect(html).toContain('data-title="Aspek terlemah"');
  });

  it("offers no more when every student shows", () => {
    expect(html).not.toContain("Tampilkan semua");
  });

  it("offers Tampilkan semua with the count when more are listed", () => {
    const more = panel(listOf({ matching: 31 }));

    expect(more).toContain("Tampilkan semua (31)");
    expect(more).toContain('href="/penilaian/asesmen?pembinaan=semua"');
  });

  it("pages the full list 25 at a time, keeping the rest of the address", () => {
    const params = { ...START_PARAMS, query: "ayu", coachingAll: true };
    const all = panel(listOf({ matching: 31, showsAll: true }), params);

    expect(all).not.toContain("Tampilkan semua");
    expect(all).toContain("1–25 dari 31 mahasiswa");
    expect(all).toContain(
      'href="/penilaian/asesmen?cari=ayu&amp;pembinaan=semua&amp;pembinaanhal=2"',
    );
  });

  it("says when nobody is listed", () => {
    const empty = panel(listOf({ rows: [], matching: 0 }));

    expect(empty).toContain(NO_COACHING);
    expect(NO_COACHING).toBe(
      "Tidak ada mahasiswa yang teridentifikasi perlu pembinaan.",
    );
    expect(empty).not.toContain("<table");
  });
});
