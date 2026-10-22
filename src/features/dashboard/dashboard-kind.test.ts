import { describe, expect, it } from "vitest";
import {
  dashboardKindsOf,
  kindToShow,
  MENTEE_DASHBOARD_ADDRESS,
  menteeDetailAddress,
  readDashboardKind,
} from "./dashboard-kind";

describe("dashboardKindsOf", () => {
  it("gives Kepala Unit, Direktur and Ketua Program Studi Dashboard pembangunan karakter only", () => {
    for (const role of [
      "head_of_unit",
      "director",
      "head_of_program",
    ] as const) {
      expect(dashboardKindsOf([role])).toEqual(["character"]);
    }
  });

  it("gives Pengasuh Dashboard anak asuh only", () => {
    expect(dashboardKindsOf(["mentor"])).toEqual(["mentees"]);
  });

  it("gives a person who is both Dashboard pembangunan karakter first, then Dashboard anak asuh", () => {
    expect(dashboardKindsOf(["mentor", "head_of_program"])).toEqual([
      "character",
      "mentees",
    ]);
  });

  it("gives a role without either right none", () => {
    expect(dashboardKindsOf(["student"])).toEqual([]);
  });
});

describe("kindToShow", () => {
  it("shows the one the address asks for, among those the account has", () => {
    expect(kindToShow(["character", "mentees"], "mentees")).toBe("mentees");
  });

  it("shows the first for an address that asks for none, or for one the account has not", () => {
    expect(kindToShow(["character", "mentees"], null)).toBe("character");
    expect(kindToShow(["character"], "mentees")).toBe("character");
    expect(kindToShow(["mentees"], "character")).toBe("mentees");
  });

  it("shows nothing to an account with neither", () => {
    expect(kindToShow([], "mentees")).toBeNull();
  });
});

describe("the address of Dashboard anak asuh", () => {
  it("names the view, and is read back", () => {
    expect(MENTEE_DASHBOARD_ADDRESS).toBe("/dashboard?tampilan=anak-asuh");
    expect(readDashboardKind({ tampilan: "anak-asuh" })).toBe("mentees");
    expect(readDashboardKind({ tampilan: "karakter" })).toBe("character");
    expect(readDashboardKind({ tampilan: "lain" })).toBeNull();
    expect(readDashboardKind({})).toBeNull();
  });

  it("opens a student's detail over the view", () => {
    expect(menteeDetailAddress("abc")).toBe(
      "/dashboard?tampilan=anak-asuh&profil=abc",
    );
  });
});
