import { describe, expect, it } from "vitest";
import { gradeAddress, readGradeParams, START_PARAMS } from "./grade-address";

describe("readGradeParams", () => {
  it("reads nothing chosen from a bare address", () => {
    expect(readGradeParams({})).toEqual(START_PARAMS);
  });

  it("reads the search, the filter and the page", () => {
    expect(
      readGradeParams({ cari: " ayu ", saring: "belum-lengkap", hal: "3" }),
    ).toEqual({
      semester: null,
      query: "ayu",
      filter: "incomplete",
      page: 3,
      profileId: null,
    });
  });

  it("trusts nothing it does not understand", () => {
    expect(
      readGradeParams({ cari: "a".repeat(101), saring: "cap", hal: "0" }),
    ).toEqual(START_PARAMS);
  });
});

describe("gradeAddress", () => {
  it("is the bare tab with nothing chosen", () => {
    expect(gradeAddress(START_PARAMS)).toBe("/penilaian/karakter");
  });

  it("names every choice, and reads back to the same choices", () => {
    const params = {
      semester: "0b6c3f1e-2d4a-4e5f-9a8b-7c6d5e4f3a2b",
      query: "ayu",
      filter: "failing",
      page: 2,
      profileId: null,
    } as const;

    const address = gradeAddress(params);

    expect(address).toBe(
      "/penilaian/karakter?semester=0b6c3f1e-2d4a-4e5f-9a8b-7c6d5e4f3a2b&cari=ayu&saring=belum-lulus&hal=2",
    );
    const search = new URLSearchParams(address.split("?")[1]);
    expect(readGradeParams(Object.fromEntries(search))).toEqual(params);
  });
});

describe("the student whose profile is open over the tab", () => {
  const PROFILE = "3f2a1b4c-5d6e-4f70-8a9b-0c1d2e3f4a5b";

  it("is read from the address, and only as an id", () => {
    expect(readGradeParams({ profil: PROFILE }).profileId).toBe(PROFILE);
    expect(readGradeParams({ profil: "bukan-id" }).profileId).toBeNull();
    expect(readGradeParams({}).profileId).toBeNull();
  });

  it("is named in the address, and read back", () => {
    const address = gradeAddress({ ...START_PARAMS, profileId: PROFILE });

    expect(address).toBe(`/penilaian/karakter?profil=${PROFILE}`);
    const search = new URLSearchParams(address.split("?")[1]);
    expect(readGradeParams(Object.fromEntries(search)).profileId).toBe(PROFILE);
  });
});

describe("the semester chosen", () => {
  const PERIOD = "7a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";

  it("is read from the address, and only as an id", () => {
    expect(readGradeParams({ semester: PERIOD }).semester).toBe(PERIOD);
    expect(readGradeParams({ semester: "ganjil" }).semester).toBeNull();
    expect(readGradeParams({}).semester).toBeNull();
  });

  it("is kept by the address of another page of the list", () => {
    const address = gradeAddress({
      ...START_PARAMS,
      semester: PERIOD,
      page: 3,
    });

    expect(address).toBe(`/penilaian/karakter?semester=${PERIOD}&hal=3`);
  });
});
