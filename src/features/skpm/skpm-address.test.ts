import { describe, expect, it } from "vitest";
import { readSkpmParams, START_PARAMS, skpmAddress } from "./skpm-address";

const STUDENT = "0b8f3c1e-0000-4000-8000-000000000002";

describe("readSkpmParams", () => {
  it("reads nothing chosen from a bare address", () => {
    expect(readSkpmParams({})).toEqual(START_PARAMS);
  });

  it("reads the search, the filter, the pages and the student whose Rincian is open", () => {
    expect(
      readSkpmParams({
        cari: " ayu ",
        saring: "kosong",
        hal: "3",
        rincian: STUDENT,
        riwayat: "2",
      }),
    ).toEqual({
      query: "ayu",
      filter: "without",
      page: 3,
      detailId: STUDENT,
      historyPage: 2,
    });
  });

  it("trusts nothing it does not understand", () => {
    expect(
      readSkpmParams({
        cari: "a".repeat(101),
        saring: "semua",
        hal: "0",
        rincian: "9985050001",
        riwayat: "x",
      }),
    ).toEqual(START_PARAMS);
  });
});

describe("skpmAddress", () => {
  it("is the bare tab with nothing chosen", () => {
    expect(skpmAddress(START_PARAMS)).toBe("/penilaian/skpm");
  });

  it("names every choice, and reads back to the same choices", () => {
    const params = {
      query: "ayu",
      filter: "with",
      page: 2,
      detailId: STUDENT,
      historyPage: 3,
    } as const;

    const address = skpmAddress(params);

    expect(address).toBe(
      `/penilaian/skpm?cari=ayu&saring=ada&hal=2&rincian=${STUDENT}&riwayat=3`,
    );
    const search = new URLSearchParams(address.split("?")[1]);
    expect(readSkpmParams(Object.fromEntries(search))).toEqual(params);
  });
});
