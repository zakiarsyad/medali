import { describe, expect, it } from "vitest";
import { cancelQuestion, fixedWords, fixQuestion } from "./fix-words";

describe("fixQuestion", () => {
  it("names the groups, the students and the day the groups start", () => {
    const size = { cohortYear: 2026, groups: 3, students: 1200 };

    expect(fixQuestion(size, "2026-09-01")).toBe(
      "Tetapkan 3 kelompok pengasuhan angkatan 2026? Seluruh 1.200 mahasiswa masuk ke kelompok dan pengasuhnya mulai 1 Sep 2026.",
    );
  });
});

describe("cancelQuestion", () => {
  it("names the angkatan and says its students go back to having no group", () => {
    const question = cancelQuestion(2026);

    expect(question).toContain("Batalkan penetapan angkatan 2026?");
    expect(question).toContain("kembali belum punya kelompok pengasuhan");
  });
});

describe("fixedWords", () => {
  it("says the decree number, the day the groups started and who fixed them", () => {
    const fixed = {
      decreeNumber: "KEP-12/UJI/2026",
      effectiveOn: "2026-09-01",
      savedBy: "Kepala Uji",
    };

    expect(fixedWords(fixed)).toBe(
      "KEP-12/UJI/2026 · berlaku 1 Sep 2026 · ditetapkan Kepala Uji",
    );
  });
});
