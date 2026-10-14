import { describe, expect, it } from "vitest";
import {
  filterNamed,
  readSikuParams,
  START_PARAMS,
  sikuAddress,
} from "./siku-address";

const ENTRY = "0b8f3c1e-0000-4000-8000-000000000001";

describe("readSikuParams", () => {
  it("reads nothing chosen from a bare address", () => {
    expect(readSikuParams({})).toEqual(START_PARAMS);
  });

  it("reads the search, the filter, the pages, the whole ranking and the entry whose students are seen", () => {
    expect(
      readSikuParams({
        cari: " ayu ",
        saring: "pengurangan",
        hal: "3",
        turun: "semua",
        naik: "semua",
        riwayat: "2",
        lihat: ENTRY,
        lihathal: "4",
      }),
    ).toEqual({
      query: "ayu",
      filter: "lost",
      page: 3,
      allFalls: true,
      allRises: true,
      historyPage: 2,
      seenEntry: ENTRY,
      seenPage: 4,
    });
  });

  it("trusts nothing it does not understand", () => {
    expect(
      readSikuParams({
        cari: "a".repeat(101),
        saring: "naik",
        hal: "0",
        turun: "ya",
        riwayat: "-1",
        lihat: "bukan-kunci",
        lihathal: "x",
      }),
    ).toEqual(START_PARAMS);
    expect(readSikuParams({ hal: ["2", "5"] }).page).toBe(2);
  });
});

describe("filterNamed", () => {
  it("names each filter, and every student for any other word", () => {
    expect(filterNamed("penambahan")).toBe("gained");
    expect(filterNamed("dasar")).toBe("base");
    expect(filterNamed("lain")).toBe("all");
  });
});

describe("sikuAddress", () => {
  it("is the bare tab with nothing chosen", () => {
    expect(sikuAddress(START_PARAMS)).toBe("/penilaian/siku");
  });

  it("holds every choice, and reads back to the same", () => {
    const params = {
      query: "Ayu L",
      filter: "base",
      page: 2,
      allFalls: true,
      allRises: false,
      historyPage: 3,
      seenEntry: ENTRY,
      seenPage: 2,
    } as const;

    const address = sikuAddress(params);

    expect(address).toBe(
      `/penilaian/siku?cari=Ayu+L&saring=dasar&hal=2&turun=semua&riwayat=3&lihat=${ENTRY}&lihathal=2`,
    );
    const search = new URLSearchParams(address.split("?")[1]);
    expect(readSikuParams(Object.fromEntries(search))).toEqual(params);
  });
});
