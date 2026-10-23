import { describe, expect, it } from "vitest";
import {
  type DashboardFilters,
  dashboardAddress,
  filtersInUse,
  type KnownChoices,
  knownFilters,
  NO_AGENCY,
  NO_FILTERS,
  readDashboardDetail,
  readDashboardFilters,
  studentDetailAddress,
} from "./dashboard-address";

const EVERY_CHOICE: DashboardFilters = {
  stageNo: 2,
  dorm: null,
  studyProgramId: 7,
  entryPath: "transfer",
  province: "Jawa Barat",
  originAgency: NO_AGENCY,
  affirmation: true,
  seedling: false,
  international: false,
};

const KNOWN: KnownChoices = {
  stages: true,
  programIds: new Set([7]),
  provinces: new Set(["Jawa Barat"]),
  agencies: new Set([NO_AGENCY, "Kementerian Keuangan"]),
};

describe("readDashboardFilters", () => {
  it("reads every filter the address holds", () => {
    const filters = readDashboardFilters({
      tahap: "2",
      prodi: "7",
      jalur: "transfer",
      provinsi: "Jawa Barat",
      instansi: NO_AGENCY,
      afirmasi: "ya",
      bibit: "tidak",
      inter: "tidak",
    });

    expect(filters).toEqual(EVERY_CHOICE);
  });

  it("takes a part it does not understand as not chosen", () => {
    const filters = readDashboardFilters({
      tahap: "5",
      prodi: "abc",
      jalur: "lain",
      provinsi: "  ",
      instansi: "x".repeat(201),
      afirmasi: "1",
      bibit: ["ya", "tidak"],
      inter: "",
    });

    expect(filters).toEqual({ ...NO_FILTERS, seedling: true });
  });

  it("reads each Asrama choice, and takes one it does not know as not chosen", () => {
    for (const dorm of [
      "semua",
      "wismantara",
      "dana_rakca",
      "cipta_bakti",
      "non",
    ] as const) {
      expect(readDashboardFilters({ asrama: dorm }).dorm).toBe(dorm);
    }
    for (const unknown of ["wismantara_putra", "1", "", "SEMUA"]) {
      expect(readDashboardFilters({ asrama: unknown }).dorm).toBeNull();
    }
  });
});

describe("knownFilters", () => {
  it("keeps every choice the account may make", () => {
    expect(knownFilters(EVERY_CHOICE, KNOWN)).toEqual(EVERY_CHOICE);
  });

  it("drops a program studi the account may not choose, as for Ketua Program Studi asking by hand", () => {
    const kaprodi = { ...KNOWN, programIds: new Set<number>() };

    expect(knownFilters(EVERY_CHOICE, kaprodi).studyProgramId).toBeNull();
  });

  it("drops a provinsi or an instansi none of the students holds, and the tahap while no period runs", () => {
    const filters = knownFilters(
      { ...EVERY_CHOICE, province: "Atlantis", originAgency: "Lain" },
      { ...KNOWN, stages: false },
    );

    expect(filters).toEqual({
      ...EVERY_CHOICE,
      stageNo: null,
      province: null,
      originAgency: null,
    });
  });
});

describe("filtersInUse", () => {
  it("counts the filters chosen, a no among them", () => {
    expect(filtersInUse(NO_FILTERS)).toBe(0);
    expect(filtersInUse({ ...NO_FILTERS, seedling: false })).toBe(1);
    expect(filtersInUse(EVERY_CHOICE)).toBe(8);
  });
});

describe("dashboardAddress", () => {
  it("writes the chosen filters so the address reads back the same view", () => {
    const address = dashboardAddress(EVERY_CHOICE);
    const params = Object.fromEntries(
      new URLSearchParams(address.split("?")[1]),
    );

    expect(address.startsWith("/dashboard?")).toBe(true);
    expect(readDashboardFilters(params)).toEqual(EVERY_CHOICE);
  });

  it("is the plain address without a filter", () => {
    expect(dashboardAddress(NO_FILTERS)).toBe("/dashboard");
  });
});

describe("the student detail over the Dashboard", () => {
  const ID = "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f5001";

  it("opens over the Dashboard as it was filtered, and closes back to it", () => {
    const address = studentDetailAddress(
      { ...NO_FILTERS, province: "Bali" },
      ID,
    );

    expect(address).toBe(`/dashboard?provinsi=Bali&profil=${ID}`);
    expect(studentDetailAddress(NO_FILTERS, ID)).toBe(
      `/dashboard?profil=${ID}`,
    );
  });

  it("reads the student the address asks for, cut to the length of an id, or none", () => {
    expect(readDashboardDetail({ profil: ID })).toBe(ID);
    expect(readDashboardDetail({ profil: ` ${ID}x` })).toBe(ID);
    expect(readDashboardDetail({ profil: "" })).toBeNull();
    expect(readDashboardDetail({})).toBeNull();
  });
});
