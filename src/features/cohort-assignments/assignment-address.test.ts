import { describe, expect, it } from "vitest";
import {
  cohortAddress,
  readAskedCohort,
  readAskedGroup,
} from "./assignment-address";

const GROUP = "11111111-1111-4111-8111-111111111111";

describe("readAskedGroup", () => {
  it("reads the group whose members the address asks to show", () => {
    expect(readAskedGroup({ kelompok: GROUP })).toBe(GROUP);
  });

  it("counts what has not the shape of a row id as not asked", () => {
    expect(readAskedGroup({})).toBeNull();
    expect(readAskedGroup({ kelompok: "1 or 1=1" })).toBeNull();
  });
});

describe("cohortAddress with a group", () => {
  it("names the group, and is read back as the same angkatan and group", () => {
    const address = cohortAddress(2026, GROUP);
    const params = new URL(address, "http://uji").searchParams;

    expect(address).toBe(`/pengasuh/tetap?angkatan=2026&kelompok=${GROUP}`);
    expect(readAskedCohort({ angkatan: params.getAll("angkatan") })).toBe(2026);
    expect(readAskedGroup({ kelompok: params.getAll("kelompok") })).toBe(GROUP);
  });
});

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
