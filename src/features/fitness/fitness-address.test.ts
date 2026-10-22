import { describe, expect, it } from "vitest";
import {
  FITNESS_FILTERS,
  fitnessAddress,
  readFitnessParams,
  START_PARAMS,
} from "./fitness-address";

describe("readFitnessParams", () => {
  it("reads nothing chosen from a bare address", () => {
    expect(readFitnessParams({})).toEqual(START_PARAMS);
  });

  it("reads the search, the filter Perlu tindak lanjut medis and the page", () => {
    expect(
      readFitnessParams({ cari: " ayu ", saring: "medis", hal: "3" }),
    ).toEqual({ query: "ayu", filter: "medical", page: 3, profileId: null });
  });

  it("trusts nothing it does not understand", () => {
    expect(
      readFitnessParams({ cari: "a".repeat(101), saring: "semua", hal: "0" }),
    ).toEqual(START_PARAMS);
  });
});

describe("fitnessAddress", () => {
  it("is the bare tab with nothing chosen", () => {
    expect(fitnessAddress(START_PARAMS)).toBe("/penilaian/jasmani");
  });

  it("names the choices, and reads back to the same choices", () => {
    const params = {
      query: "ayu",
      filter: "untested",
      page: 2,
      profileId: null,
    } as const;

    const address = fitnessAddress(params);

    expect(address).toBe("/penilaian/jasmani?cari=ayu&saring=belum&hal=2");
    const search = new URLSearchParams(address.split("?")[1]);
    expect(readFitnessParams(Object.fromEntries(search))).toEqual(params);
  });

  it.each(FITNESS_FILTERS)("reads the filter %s back as itself", (filter) => {
    const address = fitnessAddress({ ...START_PARAMS, filter });
    const search = new URLSearchParams(address.split("?")[1] ?? "");

    expect(readFitnessParams(Object.fromEntries(search)).filter).toBe(filter);
  });
});

describe("the student whose profile is open over the tab", () => {
  const PROFILE = "3f2a1b4c-5d6e-4f70-8a9b-0c1d2e3f4a5b";

  it("is read from the address, and only as an id", () => {
    expect(readFitnessParams({ profil: PROFILE }).profileId).toBe(PROFILE);
    expect(readFitnessParams({ profil: "bukan-id" }).profileId).toBeNull();
    expect(readFitnessParams({}).profileId).toBeNull();
  });

  it("is named in the address, and read back", () => {
    const address = fitnessAddress({ ...START_PARAMS, profileId: PROFILE });

    expect(address).toBe(`/penilaian/jasmani?profil=${PROFILE}`);
    const search = new URLSearchParams(address.split("?")[1]);
    expect(readFitnessParams(Object.fromEntries(search)).profileId).toBe(
      PROFILE,
    );
  });
});
