import { describe, expect, it } from "vitest";
import {
  CHOICE_ORDER,
  clarificationFileAddress,
  clarificationListAddress,
  emptyWords,
  readClarificationListParams,
  readRejectedPanelPage,
  rejectedPanelAddress,
} from "./clarification-address";

describe("readClarificationListParams", () => {
  it("starts at Diajukan on the first page, with nothing searched", () => {
    expect(readClarificationListParams({})).toEqual({
      filters: { query: "", status: "submitted" },
      page: 1,
    });
  });

  it("reads the search, the status and the page", () => {
    expect(
      readClarificationListParams({
        cari: "Ani",
        status: "diverifikasi",
        hal: "3",
      }),
    ).toEqual({ filters: { query: "Ani", status: "verified" }, page: 3 });
  });

  it("takes what it does not understand as not chosen", () => {
    expect(
      readClarificationListParams({ status: "rahasia", hal: "-1" }),
    ).toEqual({ filters: { query: "", status: "submitted" }, page: 1 });
  });
});

describe("clarificationListAddress", () => {
  it("leaves out Diajukan, an empty search and the first page", () => {
    expect(clarificationListAddress({ query: "", status: "submitted" })).toBe(
      "/asrama/klar",
    );
  });

  it("names every choice in a way the address reads back", () => {
    for (const status of CHOICE_ORDER) {
      const address = clarificationListAddress({ query: "Ani", status }, 2);
      const params = Object.fromEntries(
        new URL(address, "http://uji").searchParams,
      );

      expect(readClarificationListParams(params)).toEqual({
        filters: { query: "Ani", status },
        page: 2,
      });
    }
  });
});

describe("the page of Klarifikasi ditolak dan penetapan SP", () => {
  it("is read from the address, the first unless understood", () => {
    expect(readRejectedPanelPage({ sp: "3" })).toBe(3);
    expect(readRejectedPanelPage({ sp: "x" })).toBe(1);
    expect(readRejectedPanelPage({})).toBe(1);
  });

  it("keeps the cards as they are, and leaves out its first page", () => {
    const list = readClarificationListParams({ cari: "Ani", hal: "2" });

    expect(rejectedPanelAddress(list, 3)).toBe(
      "/asrama/klar?cari=Ani&hal=2&sp=3",
    );
    expect(rejectedPanelAddress(list, 1)).toBe("/asrama/klar?cari=Ani&hal=2");
    expect(rejectedPanelAddress(readClarificationListParams({}), 2)).toBe(
      "/asrama/klar?sp=2",
    );
  });
});

describe("emptyWords", () => {
  it("says of each status that there is none in it", () => {
    expect(emptyWords({ query: "", status: "submitted" })).toBe(
      "Tidak ada klarifikasi yang menunggu verifikasi BAM.",
    );
    expect(emptyWords({ query: "", status: "verified" })).toBe(
      "Tidak ada klarifikasi yang menunggu validasi pengelola.",
    );
    expect(emptyWords({ query: "", status: "all" })).toBe(
      "Belum ada klarifikasi.",
    );
  });

  it("speaks of the filter when a name or NIM is searched", () => {
    expect(emptyWords({ query: "Ani", status: "accepted" })).toBe(
      "Tidak ada klarifikasi pada filter ini.",
    );
  });
});

describe("clarificationFileAddress", () => {
  it("asks for the file to be shown in the page, or to be downloaded", () => {
    expect(clarificationFileAddress("abc", true)).toBe(
      "/asrama/klar/lampiran/abc?lihat=1",
    );
    expect(clarificationFileAddress("abc", false)).toBe(
      "/asrama/klar/lampiran/abc",
    );
  });
});
