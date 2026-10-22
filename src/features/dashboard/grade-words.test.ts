import { describe, expect, it } from "vitest";
import type { ShownGrades } from "./grade-recap";
import {
  componentsNote,
  gradeCardLine,
  incompleteLine,
  letterParts,
  noGradeCohortWords,
  partLabel,
} from "./grade-words";

const SHOWN: ShownGrades = {
  kind: "shown",
  graded: 1200,
  limited: 14,
  meanFinal: 78.4,
  passing: 81,
  letters: { A: 300, B: 672, C: 0, D: 128, E: 100 },
  incomplete: 35,
  parts: { attendance: 88.2, mentoring: 80, siku: 75.5, skpm: 61 },
};

describe("the card Nilai karakter", () => {
  it("says how many meet the pass letter and how many are held at 70", () => {
    expect(gradeCardLine(SHOWN, "B")).toBe(
      "81% memenuhi minimal B. 14 dibatasi 70.",
    );
  });

  it("lays each letter along the bar as its share of the worked-out grades, leaving out a letter nobody has", () => {
    expect(letterParts(SHOWN.letters, SHOWN.graded)).toEqual([
      { letter: "A", start: 0, length: 25 },
      { letter: "B", start: 25, length: 56 },
      { letter: "D", start: 81, length: (128 * 100) / 1200 },
      {
        letter: "E",
        start: 81 + (128 * 100) / 1200,
        length: (100 * 100) / 1200,
      },
    ]);
  });
});

describe("Komponen nilai karakter and Sebaran huruf", () => {
  it("names each part with its weight in brackets, as the prototype does", () => {
    const weights = { attendance: 40, mentoring: 20, siku: 25, skpm: 15 };

    expect(partLabel("attendance", weights)).toBe("Kehadiran kegiatan (40%)");
    expect(partLabel("mentoring", weights)).toBe("Pengasuhan (20%)");
    expect(partLabel("siku", weights)).toBe("Sikap dan perilaku (SIKU) (25%)");
    expect(partLabel("skpm", weights)).toBe("SKPM (15%)");
  });

  it("says where Kehadiran comes from and how many are held at 70", () => {
    expect(componentsNote(SHOWN)).toBe(
      "Kehadiran dihitung otomatis dari presensi kegiatan karakter. 14 mahasiswa nilainya dibatasi 70 karena hukuman disiplin.",
    );
  });

  it("says how many are Belum lengkap and left out", () => {
    expect(incompleteLine(SHOWN)).toBe("35 belum lengkap, tidak dihitung.");
  });
});

describe("Nilai karakter per angkatan", () => {
  it("says why no cohort is shown, with 20 worked-out grades without a filter and 5 with one", () => {
    expect(noGradeCohortWords(false)).toBe(
      "Tidak ada angkatan yang dapat ditampilkan. Angkatan tampil bila minimal 20 mahasiswa sudah memiliki nilai akhir dan nilai perorangan tidak dapat ditebak dari angkatan lain.",
    );
    expect(noGradeCohortWords(true)).toContain("minimal 5 mahasiswa");
  });
});
