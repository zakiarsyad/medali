import { describe, expect, it } from "vitest";
import {
  DORM_HEALTH_START,
  dormHealthAddress,
  readDormHealthParams,
} from "./dorm-health-address";

describe("readDormHealthParams", () => {
  it("reads the search, the dorm, the category, the illness and the page", () => {
    expect(
      readDormHealthParams({
        cari: " Ani ",
        asrama: "dana_rakca",
        kategori: "medis",
        riwayat: "asma",
        hal: "3",
      }),
    ).toEqual({
      query: "Ani",
      dorm: "dana_rakca",
      category: "medical",
      illness: "asthma",
      markOnly: false,
      page: 3,
    });
  });

  it("reads the choice Potensi kesehatan mental of the illness filter as a filter of its own", () => {
    expect(readDormHealthParams({ riwayat: "potensi-mental" })).toEqual({
      ...DORM_HEALTH_START,
      markOnly: true,
    });
  });

  it("counts what it does not understand as not chosen", () => {
    expect(
      readDormHealthParams({
        cari: "x".repeat(101),
        asrama: "rumah",
        kategori: "belum",
        riwayat: "lainnya",
        hal: "0",
      }),
    ).toEqual(DORM_HEALTH_START);
  });
});

describe("dormHealthAddress", () => {
  it("names every choice made", () => {
    expect(
      dormHealthAddress({
        query: "Ani",
        dorm: "cipta_bakti",
        category: "attention",
        illness: "allergy",
        markOnly: false,
        page: 2,
      }),
    ).toBe(
      "/asrama/sehat?cari=Ani&asrama=cipta_bakti&kategori=perhatian&riwayat=alergi&hal=2",
    );
  });

  it("names Potensi kesehatan mental under the illness filter", () => {
    expect(dormHealthAddress({ ...DORM_HEALTH_START, markOnly: true })).toBe(
      "/asrama/sehat?riwayat=potensi-mental",
    );
  });

  it("leaves out what is not chosen", () => {
    expect(dormHealthAddress(DORM_HEALTH_START)).toBe("/asrama/sehat");
  });

  it("reads back what it writes", () => {
    const params = {
      ...DORM_HEALTH_START,
      dorm: "wismantara_putri",
      illness: "epilepsy",
    } as const;
    const search = new URL(dormHealthAddress(params), "http://medali")
      .searchParams;

    expect(readDormHealthParams(Object.fromEntries(search))).toEqual(params);
  });
});
