import { describe, expect, it } from "vitest";
import {
  attendanceListAddress,
  meetingsAddress,
  readMeetingsParams,
} from "./meetings-address";

const GROUP_ID = "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f7001";

describe("readMeetingsParams", () => {
  it("reads the group and the meeting the address names", () => {
    const params = readMeetingsParams({ kelompok: GROUP_ID, pertemuan: "3" });

    expect(params).toEqual({ groupId: GROUP_ID, number: 3 });
  });

  it("names no group and opens no list for an address without them", () => {
    expect(readMeetingsParams({})).toEqual({ groupId: null, number: null });
  });

  it.each(["", "semua", "1 or 1=1", `${GROUP_ID}x`])(
    "takes %o as no group",
    (kelompok) => {
      expect(readMeetingsParams({ kelompok }).groupId).toBeNull();
    },
  );

  it.each(["0", "5", "-1", "1.5", "satu", "01", ""])(
    "takes %o as no meeting",
    (pertemuan) => {
      expect(readMeetingsParams({ pertemuan }).number).toBeNull();
    },
  );

  it("takes the first of a part that is repeated", () => {
    const params = readMeetingsParams({ pertemuan: ["2", "4"] });

    expect(params.number).toBe(2);
  });
});

describe("the addresses of the tab", () => {
  it("name the group shown", () => {
    expect(meetingsAddress(GROUP_ID)).toBe(
      `/pengasuhan/hadir?kelompok=${GROUP_ID}`,
    );
  });

  it("name the meeting whose list is open, and lead to the list on the page", () => {
    expect(attendanceListAddress(GROUP_ID, 2)).toBe(
      `/pengasuhan/hadir?kelompok=${GROUP_ID}&pertemuan=2#daftar-hadir`,
    );
  });

  it("are read back as what they name", () => {
    const address = new URL(attendanceListAddress(GROUP_ID, 4), "http://x");
    const params = Object.fromEntries(address.searchParams);

    expect(readMeetingsParams(params)).toEqual({
      groupId: GROUP_ID,
      number: 4,
    });
  });
});
