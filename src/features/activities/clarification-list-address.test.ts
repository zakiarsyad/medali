import { describe, expect, it } from "vitest";
import {
  clarificationListAddress,
  readClarificationListParams,
} from "./clarification-list-address";

describe("readClarificationListParams", () => {
  it("starts at Diajukan, with nothing searched, on the first page", () => {
    expect(readClarificationListParams({})).toEqual({
      filters: { query: "", status: "submitted" },
      page: 1,
    });
  });

  it("reads the search, the status and the page the address holds", () => {
    const params = readClarificationListParams({
      cari: " Citra ",
      status: "ditolak",
      hal: "3",
    });

    expect(params).toEqual({
      filters: { query: "Citra", status: "rejected" },
      page: 3,
    });
  });

  it.each([
    ["semua", "all"],
    ["diajukan", "submitted"],
    ["diterima", "accepted"],
    ["ditolak", "rejected"],
  ])("reads the status %s", (named, status) => {
    expect(readClarificationListParams({ status: named }).filters.status).toBe(
      status,
    );
  });

  it("takes what it does not understand as not chosen: an unknown status, a page that is no number, a text too long to search for", () => {
    const params = readClarificationListParams({
      cari: "a".repeat(101),
      status: "submitted",
      hal: "0",
    });

    expect(params).toEqual({
      filters: { query: "", status: "submitted" },
      page: 1,
    });
  });

  it("takes the first of a part that is repeated", () => {
    const params = readClarificationListParams({
      cari: ["satu", "dua"],
      status: ["semua", "ditolak"],
    });

    expect(params.filters).toEqual({ query: "satu", status: "all" });
  });
});

describe("clarificationListAddress", () => {
  it("leaves out what is not chosen, Diajukan and the first page", () => {
    expect(clarificationListAddress({ query: "", status: "submitted" })).toBe(
      "/kegiatan/klarifikasi",
    );
  });

  it("keeps the search, the status and the page", () => {
    const address = clarificationListAddress(
      { query: "Citra N", status: "all" },
      2,
    );

    expect(address).toBe(
      "/kegiatan/klarifikasi?cari=Citra+N&status=semua&hal=2",
    );
  });

  it("is read back as the filters and the page it was made of", () => {
    const filters = { query: "50% & lebih", status: "accepted" } as const;
    const address = clarificationListAddress(filters, 4);
    const search = new URL(address, "http://uji.invalid").searchParams;

    const params = readClarificationListParams(Object.fromEntries(search));

    expect(params).toEqual({ filters, page: 4 });
  });
});
