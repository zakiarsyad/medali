import { describe, expect, it } from "vitest";
import {
  groupListAddress,
  NO_FILTERS,
  readGroupListParams,
} from "./group-list-address";

describe("readGroupListParams", () => {
  it("opens the first page with nothing chosen", () => {
    expect(readGroupListParams({})).toEqual({ filters: NO_FILTERS, page: 1 });
  });

  it("reads the search, the program studi, the angkatan and the page", () => {
    const params = readGroupListParams({
      q: "  KP 24  ",
      prodi: "3",
      angkatan: "2024",
      hal: "2",
    });

    expect(params).toEqual({
      filters: { query: "KP 24", studyProgramId: 3, cohortYear: 2024 },
      page: 2,
    });
  });

  it("takes what it does not understand as not chosen", () => {
    const params = readGroupListParams({
      prodi: "tiga",
      angkatan: "24",
      hal: "0",
    });

    expect(params).toEqual({ filters: NO_FILTERS, page: 1 });
  });

  it("takes the first of a part that is repeated", () => {
    expect(readGroupListParams({ q: ["a", "b"] }).filters.query).toBe("a");
  });

  it("cuts a search that is too long", () => {
    const params = readGroupListParams({ q: "x".repeat(500) });

    expect(params.filters.query.length).toBe(100);
  });
});

describe("groupListAddress", () => {
  it("is the plain address when nothing is chosen", () => {
    expect(groupListAddress(NO_FILTERS)).toBe("/pengasuh/kelompok");
  });

  it("leaves out what is not chosen and the first page", () => {
    const filters = { ...NO_FILTERS, cohortYear: 2024 };

    expect(groupListAddress(filters, 1)).toBe(
      "/pengasuh/kelompok?angkatan=2024",
    );
  });

  it("gives an address that reads back as the same filters and page", () => {
    const filters = { query: "Hendra W", studyProgramId: 3, cohortYear: 2025 };
    const address = groupListAddress(filters, 4);
    const search = new URL(address, "http://localhost").searchParams;

    expect(readGroupListParams(Object.fromEntries(search))).toEqual({
      filters,
      page: 4,
    });
  });
});
