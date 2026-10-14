import { describe, expect, it } from "vitest";
import {
  filterNamed,
  readSikuParams,
  START_PARAMS,
  sikuAddress,
} from "./siku-address";

describe("readSikuParams", () => {
  it("reads nothing chosen from a bare address", () => {
    expect(readSikuParams({})).toEqual(START_PARAMS);
  });

  it("reads the search, the filter, the page and the whole ranking", () => {
    expect(
      readSikuParams({
        cari: " ayu ",
        saring: "pengurangan",
        hal: "3",
        turun: "semua",
        naik: "semua",
      }),
    ).toEqual({
      query: "ayu",
      filter: "lost",
      page: 3,
      allFalls: true,
      allRises: true,
    });
  });

  it("trusts nothing it does not understand", () => {
    expect(
      readSikuParams({
        cari: "a".repeat(101),
        saring: "naik",
        hal: "0",
        turun: "ya",
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
    } as const;

    const address = sikuAddress(params);

    expect(address).toBe(
      "/penilaian/siku?cari=Ayu+L&saring=dasar&hal=2&turun=semua",
    );
    const search = new URLSearchParams(address.split("?")[1]);
    expect(readSikuParams(Object.fromEntries(search))).toEqual(params);
  });
});
