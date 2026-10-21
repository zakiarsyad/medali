import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { StudentGrade } from "@/character-grades/student-grade";
import { STARTING_SCHEME } from "./scheme-ids";
import { StudentGradeView } from "./student-grade-view";

const PASSING: StudentGrade = {
  scheme: STARTING_SCHEME,
  row: {
    student: {
      id: "00000000-0000-4000-8000-000000000801",
      name: "Ani Contoh",
      nim: "9989330101",
      program: "D3 Akuntansi",
    },
    attendance: { percent: 87.5, attended: 7, counted: 8 },
    mentoring: 80,
    siku: { score: 70, adjusted: true, note: "SIKU 65 +5" },
    skpm: 72,
    grade: { complete: true, final: 77.4, letter: "B", passes: true },
  },
};

function viewOf(grade: StudentGrade): string {
  return renderToStaticMarkup(<StudentGradeView grade={grade} />);
}

describe("Nilai karakter (KEP-220) in a student's detail", () => {
  it("shows the letter, Nilai akhir, and a bar for each part with its weight and score", () => {
    const html = viewOf(PASSING);

    expect(html).toContain("Nilai karakter (KEP-220)");
    expect(html).toContain(">B<");
    expect(html).toContain("77,4");
    expect(html).toContain("Kehadiran kegiatan (25%)");
    expect(html).toContain("Nilai pengasuhan (25%)");
    expect(html).toContain("Nilai sikap dan perilaku (SIKU) (25%)");
    expect(html).toContain("Nilai Sistem Kredit Prestasi Mahasiswa (25%)");
    expect(html.match(/<meter /g)).toHaveLength(4);
    expect(html).toContain('value="87.5"');
    expect(html).toContain(">87,5<");
    expect(html).toContain(">80<");
  });

  it("says the grade reaches the pass line of the scheme", () => {
    expect(viewOf(PASSING)).toContain(
      "Memenuhi batas lulus nilai karakter minimal B.",
    );
  });

  it("says when the grade does not reach it, by the pass letter in force", () => {
    const html = viewOf({
      scheme: { ...STARTING_SCHEME, passLetter: "A" },
      row: {
        ...PASSING.row,
        grade: { complete: true, final: 77.4, letter: "B", passes: false },
      },
    });

    expect(html).toContain(
      "Belum memenuhi batas lulus nilai karakter minimal A.",
    );
  });

  it("shows Belum lengkap and a dash for a missing part, with no pass line", () => {
    const html = viewOf({
      ...PASSING,
      row: { ...PASSING.row, mentoring: null, grade: { complete: false } },
    });

    expect(html).toContain("Belum lengkap");
    expect(html).toContain(">-<");
    expect(html).not.toContain("batas lulus");
    expect(html.match(/<meter /g)).toHaveLength(3);
  });
});
