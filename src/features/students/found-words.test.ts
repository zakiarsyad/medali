import { describe, expect, it } from "vitest";
import { foundWords } from "./found-words";
import { NO_FILTERS } from "./student-list-address";

describe("foundWords", () => {
  it("names students on leave too when the list opens", () => {
    expect(foundWords(NO_FILTERS)).toBe("mahasiswa aktif dan cuti");
  });

  it("names the students who are no longer active", () => {
    expect(foundWords({ ...NO_FILTERS, status: "inactive" })).toBe(
      "mahasiswa non aktif",
    );
  });

  it("names no status when every status is counted", () => {
    expect(foundWords({ ...NO_FILTERS, status: "all" })).toBe("mahasiswa");
  });

  it("keeps the status named while a search or an Angkatan is in use", () => {
    const filters = { ...NO_FILTERS, query: "sari", cohortYear: 2025 };
    expect(foundWords(filters)).toBe("mahasiswa aktif dan cuti");
  });

  it.each(["current", "all", "inactive"] as const)(
    "says how many filters of the top bar are in use for the status %s",
    (status) => {
      const filters = { ...NO_FILTERS, status, studyProgramId: 1 };
      expect(foundWords(filters)).toBe("mahasiswa sesuai 1 filter");
    },
  );
});
