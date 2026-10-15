import { describe, expect, it } from "vitest";
import {
  assessmentAddress,
  readAssessmentParams,
  START_PARAMS,
} from "./assessment-address";

describe("readAssessmentParams", () => {
  it("reads nothing chosen from a bare address", () => {
    expect(readAssessmentParams({})).toEqual(START_PARAMS);
  });

  it("reads the search, the filter Belum diasesmen and the page", () => {
    expect(
      readAssessmentParams({ cari: " ayu ", saring: "belum", hal: "3" }),
    ).toEqual({ query: "ayu", filter: "none", page: 3 });
  });

  it("trusts nothing it does not understand", () => {
    expect(
      readAssessmentParams({
        cari: "a".repeat(101),
        saring: "semua",
        hal: "0",
      }),
    ).toEqual(START_PARAMS);
  });
});

describe("assessmentAddress", () => {
  it("is the bare tab with nothing chosen", () => {
    expect(assessmentAddress(START_PARAMS)).toBe("/penilaian/asesmen");
  });

  it("names every choice, and reads back to the same choices", () => {
    const params = { query: "ayu", filter: "none", page: 2 } as const;

    const address = assessmentAddress(params);

    expect(address).toBe("/penilaian/asesmen?cari=ayu&saring=belum&hal=2");
    const search = new URLSearchParams(address.split("?")[1]);
    expect(readAssessmentParams(Object.fromEntries(search))).toEqual(params);
  });
});
