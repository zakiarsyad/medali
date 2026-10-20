import { describe, expect, it } from "vitest";
import { punishmentText, semesterWords } from "./note-words";

describe("punishmentText", () => {
  it("shows the punishment by its name, and what Hukuman lainnya is", () => {
    expect(punishmentText("direct_guidance", "")).toBe("Pembinaan langsung");
    expect(punishmentText("warning", "")).toBe("Teguran");
    expect(punishmentText("other", "Menyapu halaman")).toBe("Menyapu halaman");
  });
});

describe("semesterWords", () => {
  it("names the running semester, and a dash while none runs", () => {
    const period = {
      id: "x",
      startYear: 2026,
      term: "odd",
      startsOn: "2026-08-01",
      endsOn: "2027-01-31",
    } as const;
    expect(semesterWords(period)).toBe("Ganjil 2026/2027");
    expect(semesterWords(null)).toBe("-");
  });
});
