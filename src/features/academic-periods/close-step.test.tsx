import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CloseStep } from "./close-step";

const FACTS = {
  period: {
    id: "p1",
    startYear: 2025,
    term: "odd" as const,
    startsOn: "2025-08-01",
    endsOn: "2026-01-31",
  },
  counts: { students: 120, complete: 100, incomplete: 20 },
  scheme: {
    weights: { attendance: 40, mentoring: 20, siku: 20, skpm: 20 },
    lowerLimits: { A: 85, B: 70, C: 60, D: 50 },
    passLetter: "B" as const,
  },
};

function stepText(): string {
  const html = renderToStaticMarkup(createElement(CloseStep, { facts: FACTS }));
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
}

describe("the closing step", () => {
  it("names the period and gives the counts before anything is kept", () => {
    const text = stepText();

    expect(text).toContain("Tutup semester Ganjil 2025/2026");
    expect(text).toContain("120 mahasiswa aktif");
    expect(text).toContain("100 nilai lengkap");
    expect(text).toContain("20 belum lengkap");
  });

  it("shows the weights and letter limits that will be kept", () => {
    const text = stepText();

    expect(text).toContain("Kehadiran kegiatan 40%");
    expect(text).toContain("Nilai pengasuhan 20%");
    expect(text).toContain("A mulai 85");
    expect(text).toContain("D mulai 50");
    expect(text).toContain("E di bawah 50");
    expect(text).toContain("Batas lulus B");
  });

  it("asks for the tick and offers the closing and a way back", () => {
    const html = renderToStaticMarkup(
      createElement(CloseStep, { facts: FACTS }),
    );

    expect(html).toContain('type="checkbox"');
    expect(html).toContain(
      "Saya paham nilai semester ini tidak dapat diubah lagi.",
    );
    expect(html).toContain("Tutup semester ini</button>");
    expect(html).toContain('href="/pengaturan/periode"');
  });
});
