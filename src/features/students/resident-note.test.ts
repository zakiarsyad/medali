import { describe, expect, it } from "vitest";
import { type ResidentFields, residentNote } from "./resident-note";

/** Angkatan 2026 is in semester 1, and angkatan 2025 in semester 3. */
const ODD_2026 = { startYear: 2026, term: "odd" } as const;

const FILLED: ResidentFields = {
  entryPath: "regular",
  sex: "female",
  cohortYear: "2026",
  status: "active",
  categories: [],
};

describe("residentNote", () => {
  it("names the dorm of a Reguler student in semester 1 or 2", () => {
    expect(residentNote(FILLED, ODD_2026)).toBe(
      "Masuk penghuni Asrama Dana Rakca.",
    );
    expect(residentNote({ ...FILLED, sex: "male" }, ODD_2026)).toBe(
      "Masuk penghuni Asrama Cipta Bakti.",
    );
  });

  it("names Wismantara for Internasional and Pembibitan in any semester", () => {
    const later = { ...FILLED, cohortYear: "2024", entryPath: "transfer" };

    expect(
      residentNote({ ...later, categories: ["isInternational"] }, ODD_2026),
    ).toBe("Masuk penghuni Asrama Wismantara Putri.");
    expect(
      residentNote(
        { ...later, sex: "male", categories: ["isSeedling"] },
        ODD_2026,
      ),
    ).toBe("Masuk penghuni Asrama Wismantara Putra.");
  });

  it.each([
    ["in semester 3", { cohortYear: "2025" }],
    ["on the alih program jalur", { entryPath: "transfer" }],
    ["on leave", { status: "on_leave" }],
    ["not active", { status: "inactive" }],
  ])("says a student %s is no resident", (_, change) => {
    expect(residentNote({ ...FILLED, ...change }, ODD_2026)).toBe(
      "Bukan penghuni asrama.",
    );
  });

  it("follows the rule while no academic period runs: no semester is known", () => {
    expect(residentNote(FILLED, null)).toBe("Bukan penghuni asrama.");
    expect(residentNote({ ...FILLED, categories: ["isSeedling"] }, null)).toBe(
      "Masuk penghuni Asrama Wismantara Putri.",
    );
  });

  it.each([
    ["jalur", { entryPath: "" }],
    ["jenis kelamin", { sex: "" }],
    ["angkatan", { cohortYear: "" }],
    ["status", { status: "" }],
  ])("says nothing while the %s is not filled", (_, change) => {
    expect(residentNote({ ...FILLED, ...change }, ODD_2026)).toBeNull();
  });
});
