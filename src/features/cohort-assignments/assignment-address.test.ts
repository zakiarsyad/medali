import { describe, expect, it } from "vitest";
import { cohortAddress, readAskedCohort } from "./assignment-address";

describe("readAskedCohort", () => {
  it("reads the angkatan the address asks for", () => {
    expect(readAskedCohort({ angkatan: "2026" })).toBe(2026);
    expect(readAskedCohort({ angkatan: ["2025", "2026"] })).toBe(2025);
  });

  it("counts what is no year as not asked", () => {
    expect(readAskedCohort({})).toBeNull();
    expect(readAskedCohort({ angkatan: "26" })).toBeNull();
    expect(readAskedCohort({ angkatan: "2026 or 1=1" })).toBeNull();
  });
});

describe("cohortAddress", () => {
  it("names the angkatan in the address of the tab", () => {
    expect(cohortAddress(2026)).toBe("/pengasuh/tetap?angkatan=2026");
  });

  it("is read back as the same angkatan", () => {
    const params = new URL(cohortAddress(2026), "http://uji").searchParams;

    expect(readAskedCohort({ angkatan: params.getAll("angkatan") })).toBe(2026);
  });
});
