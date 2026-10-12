import { describe, expect, it } from "vitest";
import { mentorLede, standingWords, titleAndUnit } from "./mentor-words";

const NO_GROUP = { groups: [], students: 0, inactiveSince: null };

const GROUPS = [
  { cohortYear: 2024, entryPath: "regular", number: 1, programCode: "D3PJK" },
  { cohortYear: 2025, entryPath: "transfer", number: 2, programCode: "MKN" },
] as const;

describe("titleAndUnit", () => {
  it("joins the gelar and the unit", () => {
    expect(titleAndUnit({ title: "M.Si.", unit: "Unit Uji" })).toBe(
      "M.Si. · Unit Uji",
    );
  });

  it("shows the gelar alone for a mentor without a unit", () => {
    expect(titleAndUnit({ title: "M.Si.", unit: null })).toBe("M.Si.");
  });

  it("shows the unit alone for a mentor without a gelar", () => {
    expect(titleAndUnit({ title: "", unit: "Unit Uji" })).toBe("Unit Uji");
  });

  it("is empty when neither is kept", () => {
    expect(titleAndUnit({ title: null, unit: null })).toBe("");
  });
});

describe("standingWords", () => {
  it("names the groups a mentor holds and how many students they have", () => {
    const words = standingWords({
      status: "mentoring",
      groups: [...GROUPS],
      students: 1234,
      inactiveSince: null,
    });

    expect(words).toBe(
      "Mengasuh KP 24-D3PJK-01, KP 25-MKN-AJ-02 dengan 1.234 mahasiswa.",
    );
  });

  it("says a Cadangan mentor holds no group yet", () => {
    expect(standingWords({ ...NO_GROUP, status: "reserve" })).toBe(
      "Pengasuh cadangan, belum memegang kelompok.",
    );
  });

  it("says since when a mentor is Tidak aktif, and why", () => {
    const words = standingWords({
      ...NO_GROUP,
      status: "inactive",
      inactiveSince: "2026-03-04",
    });

    expect(words).toBe(
      "Tidak aktif sebagai pengasuh sejak 4 Mar 2026 (Akun dihapus atau peran diganti).",
    );
  });

  it("leaves the day out when it is not known, rather than make one up", () => {
    expect(standingWords({ ...NO_GROUP, status: "inactive" })).toBe(
      "Tidak aktif sebagai pengasuh (Akun dihapus atau peran diganti).",
    );
  });
});

describe("mentorLede", () => {
  it("starts with the gelar and the unit", () => {
    const lede = mentorLede({
      ...NO_GROUP,
      status: "reserve",
      title: "M.Si.",
      unit: "Unit Uji",
    });

    expect(lede).toBe(
      "M.Si. · Unit Uji. Pengasuh cadangan, belum memegang kelompok.",
    );
  });

  it("adds no second dot after a gelar that ends with one", () => {
    const lede = mentorLede({
      ...NO_GROUP,
      status: "reserve",
      title: "M.Si.",
      unit: null,
    });

    expect(lede).toBe("M.Si. Pengasuh cadangan, belum memegang kelompok.");
  });

  it("is the status alone for a mentor without a gelar and a unit", () => {
    const lede = mentorLede({
      ...NO_GROUP,
      status: "reserve",
      title: null,
      unit: null,
    });

    expect(lede).toBe("Pengasuh cadangan, belum memegang kelompok.");
  });
});
