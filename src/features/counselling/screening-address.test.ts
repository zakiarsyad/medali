import { describe, expect, it } from "vitest";
import {
  readScreeningParams,
  SCREENING_ADDRESS,
  screeningAddress,
} from "./screening-address";

describe("the address of Kesehatan mental", () => {
  it("reads the search, the filter and the page", () => {
    expect(
      readScreeningParams({
        cari: " Bayu ",
        filter: "perlu-konseling",
        hal: "2",
      }),
    ).toEqual({ query: "Bayu", filter: "counselling", page: 2 });
    expect(readScreeningParams({ filter: "menunggu-persetujuan" }).filter).toBe(
      "waiting",
    );
  });

  it("takes what it does not understand as not chosen", () => {
    expect(
      readScreeningParams({ filter: "semua-rahasia", hal: "-3", cari: [] }),
    ).toEqual({ query: "", filter: "all", page: 1 });
  });

  it("leaves out what is not chosen, and puts back what is", () => {
    expect(screeningAddress({ query: "", filter: "all", page: 1 })).toBe(
      SCREENING_ADDRESS,
    );
    const address = screeningAddress({
      query: "Bayu",
      filter: "waiting",
      page: 3,
    });
    expect(address).toBe(
      "/penilaian/mental?cari=Bayu&filter=menunggu-persetujuan&hal=3",
    );
  });
});
