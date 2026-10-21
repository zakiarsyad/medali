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
    ).toEqual({ query: "Bayu", filter: "counselling", page: 2, sharedPage: 1 });
    expect(readScreeningParams({ filter: "menunggu-persetujuan" }).filter).toBe(
      "waiting",
    );
    expect(readScreeningParams({ filter: "disetujui" }).filter).toBe(
      "approved",
    );
    expect(
      screeningAddress({
        query: "",
        filter: "approved",
        page: 1,
        sharedPage: 1,
      }),
    ).toBe("/penilaian/mental?filter=disetujui");
  });

  it("takes what it does not understand as not chosen", () => {
    expect(
      readScreeningParams({
        filter: "semua-rahasia",
        hal: "-3",
        "hal-data": "x",
        cari: [],
      }),
    ).toEqual({ query: "", filter: "all", page: 1, sharedPage: 1 });
  });

  it("reads the page of Data yang dipublikasikan untuk Anda apart from the page of Daftar mahasiswa", () => {
    expect(readScreeningParams({ hal: "2", "hal-data": "3" })).toMatchObject({
      page: 2,
      sharedPage: 3,
    });
  });

  it("leaves out what is not chosen, and puts back what is", () => {
    expect(
      screeningAddress({ query: "", filter: "all", page: 1, sharedPage: 1 }),
    ).toBe(SCREENING_ADDRESS);
    const address = screeningAddress({
      query: "Bayu",
      filter: "waiting",
      page: 3,
      sharedPage: 2,
    });
    expect(address).toBe(
      "/penilaian/mental?cari=Bayu&filter=menunggu-persetujuan&hal=3&hal-data=2",
    );
  });
});
