import { describe, expect, it } from "vitest";
import {
  groupAddress,
  groupListAddress,
  groupMemberAddress,
  NO_FILTERS,
  readGroupListParams,
} from "./group-list-address";

const GROUP_ID = "0b0e7a52-6f0e-4f43-9d0a-3f1f1c9a2b11";
const STUDENT_ID = "5c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f";

const OPENS_THE_LIST = {
  filters: NO_FILTERS,
  page: 1,
  groupId: null,
  memberPage: 1,
  detailId: null,
};

function readAddress(address: string) {
  const search = new URL(address, "http://localhost").searchParams;
  return readGroupListParams(Object.fromEntries(search));
}

describe("readGroupListParams", () => {
  it("opens the first page of the list with nothing chosen", () => {
    expect(readGroupListParams({})).toEqual(OPENS_THE_LIST);
  });

  it("reads the search, the program studi, the angkatan and the page", () => {
    const params = readGroupListParams({
      q: "  KP 24  ",
      prodi: "3",
      angkatan: "2024",
      hal: "2",
    });

    expect(params).toEqual({
      ...OPENS_THE_LIST,
      filters: { query: "KP 24", studyProgramId: 3, cohortYear: 2024 },
      page: 2,
    });
  });

  it("takes what it does not understand as not chosen", () => {
    const params = readGroupListParams({
      prodi: "tiga",
      angkatan: "24",
      hal: "0",
    });

    expect(params).toEqual(OPENS_THE_LIST);
  });

  it("takes the first of a part that is repeated", () => {
    expect(readGroupListParams({ q: ["a", "b"] }).filters.query).toBe("a");
  });

  it("cuts a search that is too long", () => {
    const params = readGroupListParams({ q: "x".repeat(500) });

    expect(params.filters.query.length).toBe(100);
  });

  it("drops the null character from the search, before it is cut", () => {
    const query = (q: string) => readGroupListParams({ q }).filters.query;

    expect(query("\0KP\0 24\0")).toBe("KP 24");
    expect(query("\0 \0 ")).toBe("");
    expect(query(`\0${"x".repeat(100)}`)).toBe("x".repeat(100));
  });

  it("reads the group and the student an address names, cut to the length of an id", () => {
    const params = readGroupListParams({
      kelompok: ` ${GROUP_ID}-and-more `,
      profil: STUDENT_ID,
    });

    expect(params.groupId).toBe(GROUP_ID);
    expect(params.detailId).toBe(STUDENT_ID);
  });

  it("reads the page of the members apart from the page of the list", () => {
    const params = readGroupListParams({
      kelompok: GROUP_ID,
      "hal-anggota": "3",
    });

    expect(params.memberPage).toBe(3);
    expect(params.page).toBe(1);
  });

  it("takes a page of the members it does not understand as the first", () => {
    for (const sent of ["0", "-2", "dua", "1.5", ""]) {
      expect(readGroupListParams({ "hal-anggota": sent }).memberPage).toBe(1);
    }
  });
});

describe("groupListAddress", () => {
  it("is the plain address when nothing is chosen", () => {
    expect(groupListAddress(NO_FILTERS)).toBe("/pengasuh/kelompok");
  });

  it("leaves out what is not chosen and the first page", () => {
    const filters = { ...NO_FILTERS, cohortYear: 2024 };

    expect(groupListAddress(filters, 1)).toBe(
      "/pengasuh/kelompok?angkatan=2024",
    );
  });

  it("gives an address that reads back as the same filters and page", () => {
    const filters = { query: "Hendra W", studyProgramId: 3, cohortYear: 2025 };

    expect(readAddress(groupListAddress(filters, 4))).toEqual({
      ...OPENS_THE_LIST,
      filters,
      page: 4,
    });
  });
});

describe("groupAddress", () => {
  it("names the group, and reads back as that group with no student", () => {
    const address = groupAddress(GROUP_ID);

    expect(address).toBe(`/pengasuh/kelompok?kelompok=${GROUP_ID}`);
    expect(readAddress(address)).toEqual({
      ...OPENS_THE_LIST,
      groupId: GROUP_ID,
    });
  });

  it("leaves out the first page of the members", () => {
    expect(groupAddress(GROUP_ID, 1)).toBe(groupAddress(GROUP_ID));
  });

  it("keeps the group with a later page of the members", () => {
    const address = groupAddress(GROUP_ID, 2);

    expect(address).toBe(
      `/pengasuh/kelompok?kelompok=${GROUP_ID}&hal-anggota=2`,
    );
    expect(readAddress(address)).toEqual({
      ...OPENS_THE_LIST,
      groupId: GROUP_ID,
      memberPage: 2,
    });
  });
});

describe("groupMemberAddress", () => {
  it("names the group and the student whose detail is open over it", () => {
    const address = groupMemberAddress(GROUP_ID, STUDENT_ID);

    expect(readAddress(address)).toEqual({
      ...OPENS_THE_LIST,
      groupId: GROUP_ID,
      detailId: STUDENT_ID,
    });
  });

  it("keeps the page of the members the detail is opened from", () => {
    const address = groupMemberAddress(GROUP_ID, STUDENT_ID, 2);

    expect(readAddress(address)).toEqual({
      ...OPENS_THE_LIST,
      groupId: GROUP_ID,
      memberPage: 2,
      detailId: STUDENT_ID,
    });
  });
});
