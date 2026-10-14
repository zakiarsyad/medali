import { describe, expect, it } from "vitest";
import { ACTIVITY_CATEGORIES, AUDIENCES } from "./activity-ids";
import {
  audienceWords,
  CATEGORY_WORDS,
  dayWords,
  hoursWords,
  organiserLine,
  placeWords,
  repeatWords,
  validityWords,
} from "./activity-words";

describe("the words of a dorm activity", () => {
  it("name the eight Kategori in the order the form offers them", () => {
    const words = ACTIVITY_CATEGORIES.map(
      (category) => CATEGORY_WORDS[category],
    );

    expect(words).toEqual([
      "Apel",
      "Ibadah",
      "Olahraga",
      "Kebersihan",
      "Pembinaan karakter",
      "Belajar bersama",
      "Kesenian dan budaya",
      "Lainnya",
    ]);
  });

  it("name every Peserta: all, the men, the women and each dorm", () => {
    expect(AUDIENCES.map(audienceWords)).toEqual([
      "Semua penghuni",
      "Penghuni putra",
      "Penghuni putri",
      "Asrama Wismantara Putra",
      "Asrama Wismantara Putri",
      "Asrama Dana Rakca",
      "Asrama Cipta Bakti",
    ]);
  });
});

describe("repeatWords", () => {
  it.each([
    [{ pattern: "daily", weekdays: [], monthDay: null }, "Setiap hari"],
    [{ pattern: "weekly", weekdays: [3], monthDay: null }, "Setiap Rabu"],
    [
      { pattern: "weekly", weekdays: [0, 6], monthDay: null },
      "Setiap Minggu, Sabtu",
    ],
    [{ pattern: "monthly", weekdays: [], monthDay: 28 }, "Setiap tanggal 28"],
    [{ pattern: "once", weekdays: [], monthDay: null }, ""],
  ] as const)("says %j as %j", (repeat, words) => {
    expect(repeatWords({ ...repeat, weekdays: [...repeat.weekdays] })).toBe(
      words,
    );
  });
});

describe("the lines of a list", () => {
  it("show the hours with a dash between them", () => {
    expect(hoursWords("05:30", "06:15")).toBe("05:30–06:15");
  });

  it("show Berlaku to its last day, or seterusnya without one", () => {
    expect(validityWords("2026-08-01", null)).toBe("1 Agu 2026 – seterusnya");
    expect(validityWords("2026-08-01", "2026-12-31")).toBe(
      "1 Agu 2026 – 31 Des 2026",
    );
  });

  it("show a day with its day of the week", () => {
    expect(dayWords("2026-10-14")).toBe("Rabu, 14 Okt 2026");
    expect(dayWords("2026-10-18")).toBe("Minggu, 18 Okt 2026");
  });

  it("show a line for an activity without a place", () => {
    expect(placeWords("")).toBe("-");
    expect(placeWords("Aula uji")).toBe("Aula uji");
  });

  it("show the penanggung jawab in full, with a name only when one was given", () => {
    expect(organiserLine("bam", "")).toBe("Badan Asrama Mahasiswa");
    expect(organiserLine("coach", "Tim Uji")).toBe("Pelatih · Tim Uji");
  });
});
