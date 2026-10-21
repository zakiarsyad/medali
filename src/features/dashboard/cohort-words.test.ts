import { describe, expect, it } from "vitest";
import { cohortDetail, noCohortWords } from "./cohort-words";

const ODD_2026 = { startYear: 2026, term: "odd" } as const;

describe("cohortDetail", () => {
  it("names the jalur and the semester the angkatan is in now", () => {
    expect(
      cohortDetail({ cohortYear: 2025, entryPath: "regular" }, ODD_2026),
    ).toBe("Reguler · Smt 3");
    expect(
      cohortDetail({ cohortYear: 2026, entryPath: "transfer" }, ODD_2026),
    ).toBe("Alih program · Smt 1");
  });

  it("names the jalur alone while no academic period runs", () => {
    expect(cohortDetail({ cohortYear: 2025, entryPath: "regular" }, null)).toBe(
      "Reguler",
    );
  });
});

describe("noCohortWords", () => {
  it("says how many assessed students a cohort needs, with a filter and without", () => {
    expect(noCohortWords(false)).toBe(
      "Tidak ada angkatan yang dapat ditampilkan. Angkatan tampil bila minimal 20 mahasiswa sudah diasesmen dan nilai perorangan tidak dapat ditebak dari angkatan lain.",
    );
    expect(noCohortWords(true)).toContain("minimal 5 mahasiswa");
  });
});
