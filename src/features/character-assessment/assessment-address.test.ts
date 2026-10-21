import { describe, expect, it } from "vitest";
import {
  assessmentAddress,
  readAssessmentParams,
  START_PARAMS,
} from "./assessment-address";

const STUDENT = "0b8f3c1e-0000-4000-8000-000000000003";

describe("readAssessmentParams", () => {
  it("reads nothing chosen from a bare address", () => {
    expect(readAssessmentParams({})).toEqual(START_PARAMS);
  });

  it("reads the search, the filter Belum diasesmen, the page and the student whose history is open", () => {
    expect(
      readAssessmentParams({
        cari: " ayu ",
        saring: "belum",
        hal: "3",
        riwayat: STUDENT,
      }),
    ).toEqual({
      ...START_PARAMS,
      query: "ayu",
      filter: "none",
      page: 3,
      historyId: STUDENT,
    });
  });

  it("reads the full list of Teridentifikasi perlu pembinaan and its page", () => {
    expect(
      readAssessmentParams({ pembinaan: "semua", pembinaanhal: "2" }),
    ).toEqual({ ...START_PARAMS, coachingAll: true, coachingPage: 2 });
  });

  it("trusts nothing it does not understand", () => {
    expect(
      readAssessmentParams({
        cari: "a".repeat(101),
        saring: "semua",
        hal: "0",
        riwayat: "Ayu",
        pembinaan: "ya",
        pembinaanhal: "-1",
      }),
    ).toEqual(START_PARAMS);
  });
});

describe("assessmentAddress", () => {
  it("is the bare tab with nothing chosen", () => {
    expect(assessmentAddress(START_PARAMS)).toBe("/penilaian/asesmen");
  });

  it("names every choice, and reads back to the same choices", () => {
    const params = {
      query: "ayu",
      filter: "none",
      page: 2,
      historyId: STUDENT,
      coachingAll: true,
      coachingPage: 3,
    } as const;

    const address = assessmentAddress(params);

    expect(address).toBe(
      `/penilaian/asesmen?cari=ayu&saring=belum&hal=2&riwayat=${STUDENT}&pembinaan=semua&pembinaanhal=3`,
    );
    const search = new URLSearchParams(address.split("?")[1]);
    expect(readAssessmentParams(Object.fromEntries(search))).toEqual(params);
  });

  it("leaves out the page of the full list while only the first rows show", () => {
    expect(assessmentAddress({ ...START_PARAMS, coachingPage: 3 })).toBe(
      "/penilaian/asesmen",
    );
  });
});
