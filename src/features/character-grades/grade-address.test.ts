import { describe, expect, it } from "vitest";
import { gradeAddress, readGradeParams, START_PARAMS } from "./grade-address";

describe("readGradeParams", () => {
  it("reads nothing chosen from a bare address", () => {
    expect(readGradeParams({})).toEqual(START_PARAMS);
  });

  it("reads the search, the filter and the page", () => {
    expect(
      readGradeParams({ cari: " ayu ", saring: "belum-lengkap", hal: "3" }),
    ).toEqual({ query: "ayu", filter: "incomplete", page: 3 });
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
    const params = { query: "ayu", filter: "failing", page: 2 } as const;

    const address = gradeAddress(params);

    expect(address).toBe(
      "/penilaian/karakter?cari=ayu&saring=belum-lulus&hal=2",
    );
    const search = new URLSearchParams(address.split("?")[1]);
    expect(readGradeParams(Object.fromEntries(search))).toEqual(params);
  });
});
