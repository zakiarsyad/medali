import { describe, expect, it } from "vitest";
import {
  readScoresParams,
  scoreStudentAddress,
  scoresAddress,
} from "./scores-address";

const GROUP_ID = "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f7001";
const STUDENT_ID = "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f7002";

describe("readScoresParams", () => {
  it("reads the group and the student the address names", () => {
    const params = readScoresParams({ kelompok: GROUP_ID, profil: STUDENT_ID });

    expect(params).toEqual({ groupId: GROUP_ID, detailId: STUDENT_ID });
  });

  it("names no group and opens no detail for an address without them", () => {
    expect(readScoresParams({})).toEqual({ groupId: null, detailId: null });
  });

  it.each(["", "semua", "1 or 1=1", `${GROUP_ID}x`])(
    "takes %o as no group",
    (kelompok) => {
      expect(readScoresParams({ kelompok }).groupId).toBeNull();
    },
  );

  it("keeps no more of what stands for a student than an id is long", () => {
    const params = readScoresParams({
      profil: `${STUDENT_ID}${"x".repeat(500)}`,
    });

    expect(params.detailId).toBe(STUDENT_ID);
  });
});

describe("scoresAddress", () => {
  it("names the group shown", () => {
    expect(scoresAddress(GROUP_ID)).toBe(
      `/pengasuhan/nilai?kelompok=${GROUP_ID}`,
    );
  });

  it("is the tab alone when no group is named", () => {
    expect(scoresAddress(null)).toBe("/pengasuhan/nilai");
  });
});

describe("scoreStudentAddress", () => {
  it("opens the detail of a student over the scores of their group", () => {
    const address = scoreStudentAddress(GROUP_ID, STUDENT_ID);

    expect(address).toBe(
      `/pengasuhan/nilai?kelompok=${GROUP_ID}&profil=${STUDENT_ID}`,
    );
    expect(
      readScoresParams({ kelompok: GROUP_ID, profil: STUDENT_ID }),
    ).toEqual({ groupId: GROUP_ID, detailId: STUDENT_ID });
  });
});
