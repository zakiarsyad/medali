import { describe, expect, it } from "vitest";
import {
  mentorAddress,
  mentorListAddress,
  mentorStudentAddress,
  NO_FILTERS,
  readMentorListParams,
} from "./mentor-list-address";

const MENTOR_ID = "0b0e7a52-6f0e-4f43-9d0a-3f1f1c9a2b11";
const STUDENT_ID = "5c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f";

const OPENS_THE_LIST = {
  filters: NO_FILTERS,
  page: 1,
  mentorId: null,
  studentPage: 1,
  detailId: null,
};

function readAddress(address: string) {
  const search = new URL(address, "http://localhost").searchParams;
  return readMentorListParams(Object.fromEntries(search));
}

describe("readMentorListParams", () => {
  it("opens the first page of the list with nothing chosen", () => {
    expect(readMentorListParams({})).toEqual(OPENS_THE_LIST);
  });

  it("reads the search, the status, the unit and the page", () => {
    const params = readMentorListParams({
      q: "  Hendra  ",
      status: "tidak-aktif",
      unit: " Unit Uji ",
      hal: "2",
    });

    expect(params).toEqual({
      ...OPENS_THE_LIST,
      filters: { query: "Hendra", status: "inactive", unit: "Unit Uji" },
      page: 2,
    });
  });

  it.each([
    ["mengasuh", "mentoring"],
    ["cadangan", "reserve"],
    ["tidak-aktif", "inactive"],
  ] as const)("reads the status %s", (written, status) => {
    expect(readMentorListParams({ status: written }).filters.status).toBe(
      status,
    );
  });

  it("takes what it does not understand as not chosen", () => {
    const params = readMentorListParams({
      status: "inactive",
      unit: "   ",
      hal: "0",
    });

    expect(params).toEqual(OPENS_THE_LIST);
  });

  it("takes the first of a part that is given twice", () => {
    const params = readMentorListParams({
      status: ["cadangan", "mengasuh"],
      hal: ["3", "4"],
    });

    expect(params.filters.status).toBe("reserve");
    expect(params.page).toBe(3);
  });

  it("cuts a search, a unit and an id that are too long", () => {
    const params = readMentorListParams({
      q: "a".repeat(500),
      unit: "u".repeat(500),
      pengasuh: "x".repeat(500),
      profil: "y".repeat(500),
    });

    expect(params.filters.query).toHaveLength(100);
    expect(params.filters.unit).toHaveLength(200);
    expect(params.mentorId).toHaveLength(36);
    expect(params.detailId).toHaveLength(36);
  });

  it("reads the mentor whose page is open, and the student over it", () => {
    const params = readMentorListParams({
      pengasuh: MENTOR_ID,
      profil: STUDENT_ID,
    });

    expect(params.mentorId).toBe(MENTOR_ID);
    expect(params.detailId).toBe(STUDENT_ID);
  });
});

describe("mentorListAddress", () => {
  it("is the plain address when nothing is chosen", () => {
    expect(mentorListAddress(NO_FILTERS)).toBe("/pengasuh/daftar");
  });

  it("is read back as the same filters and page", () => {
    const filters = {
      query: "Uji & Ani",
      status: "reserve",
      unit: "Unit Uji / 2",
    } as const;

    const params = readAddress(mentorListAddress(filters, 3));

    expect(params).toEqual({ ...OPENS_THE_LIST, filters, page: 3 });
  });
});

describe("mentorAddress", () => {
  it("names the mentor, and is read back as that mentor's page", () => {
    const address = mentorAddress(MENTOR_ID);

    expect(address).toBe(`/pengasuh/daftar?pengasuh=${MENTOR_ID}`);
    expect(readAddress(address)).toEqual({
      ...OPENS_THE_LIST,
      mentorId: MENTOR_ID,
    });
  });

  it("leaves out the first page of the students", () => {
    expect(mentorAddress(MENTOR_ID, 1)).toBe(mentorAddress(MENTOR_ID));
  });

  it("keeps the mentor with a later page of the students", () => {
    const address = mentorAddress(MENTOR_ID, 2);

    expect(address).toBe(`/pengasuh/daftar?pengasuh=${MENTOR_ID}&hal-binaan=2`);
    expect(readAddress(address)).toEqual({
      ...OPENS_THE_LIST,
      mentorId: MENTOR_ID,
      studentPage: 2,
    });
  });
});

describe("readMentorListParams, for the page of a mentor", () => {
  it("reads the page of the students apart from the page of the list", () => {
    const params = readMentorListParams({
      pengasuh: MENTOR_ID,
      "hal-binaan": "3",
    });

    expect(params.studentPage).toBe(3);
    expect(params.page).toBe(1);
  });

  it("takes a page of the students it does not understand as the first", () => {
    for (const sent of ["0", "-2", "dua", "1.5", ""]) {
      expect(readMentorListParams({ "hal-binaan": sent }).studentPage).toBe(1);
    }
  });
});

describe("mentorStudentAddress", () => {
  it("names the mentor and the student whose detail is open over the page", () => {
    const params = readAddress(mentorStudentAddress(MENTOR_ID, STUDENT_ID));

    expect(params).toEqual({
      ...OPENS_THE_LIST,
      mentorId: MENTOR_ID,
      detailId: STUDENT_ID,
    });
  });

  it("keeps the page of the students the detail is opened from", () => {
    const params = readAddress(mentorStudentAddress(MENTOR_ID, STUDENT_ID, 2));

    expect(params).toEqual({
      ...OPENS_THE_LIST,
      mentorId: MENTOR_ID,
      studentPage: 2,
      detailId: STUDENT_ID,
    });
  });
});
