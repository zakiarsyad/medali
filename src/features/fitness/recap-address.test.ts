import { describe, expect, it } from "vitest";
import { START_PARAMS } from "./fitness-address";
import {
  RECAP_ILLNESSES,
  RECAP_START,
  readRecapParams,
  recapAddress,
} from "./recap-address";

describe("readRecapParams", () => {
  it("reads the search, the filters and the page of the recap", () => {
    expect(
      readRecapParams({
        rcari: " Ani ",
        rtinggal: "asrama",
        rkategori: "medis",
        rriwayat: "asma",
        rhal: "3",
      }),
    ).toEqual({
      query: "Ani",
      residence: "dorm",
      category: "medical",
      illness: "asthma",
      page: 3,
    });
  });

  it("counts what it does not understand as not chosen", () => {
    expect(
      readRecapParams({
        rtinggal: "rumah",
        rkategori: "belum",
        rriwayat: "lainnya",
        rhal: "0",
      }),
    ).toEqual(RECAP_START);
  });
});

describe("recapAddress", () => {
  it("keeps the list's choices beside the recap's", () => {
    expect(
      recapAddress(
        { ...START_PARAMS, filter: "good" },
        { ...RECAP_START, residence: "non_dorm", page: 2 },
      ),
    ).toBe("/penilaian/jasmani?saring=baik&rtinggal=non&rhal=2");
  });

  it("leaves out what is not chosen", () => {
    expect(recapAddress(START_PARAMS, RECAP_START)).toBe("/penilaian/jasmani");
  });
});

it("offers the nine named illnesses, not Lainnya", () => {
  expect(RECAP_ILLNESSES).toHaveLength(9);
  expect(RECAP_ILLNESSES).not.toContain("other");
});
