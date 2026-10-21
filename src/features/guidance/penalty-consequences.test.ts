import { describe, expect, it } from "vitest";
import {
  consequencesOf,
  historyWords,
  isLowerThanBefore,
} from "./penalty-consequences";

const PERIODS = [
  { startYear: 2026, term: "odd", startsOn: "2026-08-01" },
] as const;

describe("consequencesOf", () => {
  it("gives a Ringan penalty its kerja sosial dates and the cap of 70 on nilai karakter", () => {
    expect(
      consequencesOf({
        category: "light",
        level: 1,
        start: "2026-10-14",
        day: "2026-10-12",
        cohortYear: 2025,
        periods: PERIODS,
      }),
    ).toEqual([
      { title: "Hukuman", text: "Teguran lisan tertulis" },
      {
        title: "Kerja sosial",
        text: "7 hari, 14 Okt 2026 sampai 20 Okt 2026",
      },
      { title: "Nilai karakter", text: "Dibatasi paling tinggi 70." },
    ]);
  });

  it("gives Berat jenjang pertama the two semesters of suspension and the semester to repeat, from the semester of the Tanggal", () => {
    const lines = consequencesOf({
      category: "heavy",
      level: 1,
      start: "2026-10-14",
      day: "2026-10-12",
      cohortYear: 2025,
      periods: PERIODS,
    });
    expect(lines.map((line) => line.title)).toEqual([
      "Hukuman",
      "Kerja sosial",
      "Status",
      "Akademik",
    ]);
    expect(lines[2]?.text).toBe(
      "Diberhentikan sementara selama semester 3 dan 4, terhitung mulai semester saat pelanggaran dilakukan (ayat 5a).",
    );
    expect(lines[3]?.text).toBe(
      "Wajib mengulang seluruh mata kuliah semester 3 (ayat 5b).",
    );
  });

  it("names no semester while the Tanggal is in no period, and no dates while Mulai is empty", () => {
    const lines = consequencesOf({
      category: "heavy",
      level: 1,
      start: "",
      day: "2026-07-01",
      cohortYear: 2025,
      periods: PERIODS,
    });
    expect(lines[1]?.text).toBe("8 bulan");
    expect(lines[2]?.text).toBe(
      "Diberhentikan sementara selama 2 semester, terhitung mulai semester saat pelanggaran dilakukan (ayat 5a).",
    );
    expect(lines[3]?.text).toBe(
      "Wajib mengulang seluruh mata kuliah semester saat pelanggaran dilakukan (ayat 5b).",
    );
  });

  it("says the status ends for good for the other two Berat", () => {
    expect(
      consequencesOf({
        category: "heavy",
        level: 3,
        start: "2026-10-14",
        day: "2026-10-12",
        cohortYear: null,
        periods: PERIODS,
      }),
    ).toEqual([
      {
        title: "Hukuman",
        text: "Diberhentikan dengan tidak hormat secara permanen",
      },
      {
        title: "Status",
        text: "Status sebagai mahasiswa berakhir secara permanen.",
      },
    ]);
  });
});

describe("the history of the student", () => {
  const top = { category: "medium", level: 1, day: "2026-09-02" } as const;

  it("warns for a Jenjang lower than the highest before, and not for the same or higher", () => {
    expect(isLowerThanBefore("light", 3, top)).toBe(true);
    expect(isLowerThanBefore("medium", 1, top)).toBe(false);
    expect(isLowerThanBefore("heavy", 1, top)).toBe(false);
    expect(isLowerThanBefore("light", 1, null)).toBe(false);
  });

  it("says how many penalties the student has and the highest one, or that there are none", () => {
    expect(historyWords({ count: 0, top: null })).toBe(
      "Belum ada riwayat pelanggaran. Ini pelanggaran pertama mahasiswa.",
    );
    expect(historyWords({ count: 2, top })).toBe(
      "Riwayat: 2 pelanggaran. Hukuman tertinggi sebelumnya sedang jenjang pertama (2 Sep 2026). Sesuai ayat (6), bila mahasiswa mengulangi perbuatan yang ancamannya lebih tinggi, dikenakan hukuman yang lebih tinggi tersebut.",
    );
  });
});
