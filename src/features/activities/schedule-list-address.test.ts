import { describe, expect, it } from "vitest";
import {
  readScheduleListParams,
  scheduleListAddress,
} from "./schedule-list-address";

function readAddress(address: string) {
  const search = new URL(address, "http://localhost").searchParams;
  return readScheduleListParams(Object.fromEntries(search));
}

describe("readScheduleListParams", () => {
  it("opens the first page of every tahap with nothing chosen", () => {
    expect(readScheduleListParams({})).toEqual({ level: null, page: 1 });
  });

  it("reads the tahap and the page", () => {
    expect(readScheduleListParams({ tahap: "3", hal: "2" })).toEqual({
      level: 3,
      page: 2,
    });
  });

  it.each(["0", "5", "12", "-1", "1.5", "dua", " 2", ""])(
    "takes the tahap %j as not chosen",
    (tahap) => {
      expect(readScheduleListParams({ tahap }).level).toBeNull();
    },
  );

  it.each(["0", "-2", "1.5", "dua", "1234567", ""])(
    "takes the page %j as the first page",
    (hal) => {
      expect(readScheduleListParams({ hal }).page).toBe(1);
    },
  );

  it("takes the first of a part that is given twice", () => {
    expect(readScheduleListParams({ tahap: ["2", "4"] }).level).toBe(2);
  });
});

describe("scheduleListAddress", () => {
  it("is the tab itself for every tahap on the first page", () => {
    expect(scheduleListAddress(null)).toBe("/kegiatan/ppks");
  });

  it("names the tahap, and the page only after the first", () => {
    expect(scheduleListAddress(2)).toBe("/kegiatan/ppks?tahap=2");
    expect(scheduleListAddress(2, 3)).toBe("/kegiatan/ppks?tahap=2&hal=3");
    expect(scheduleListAddress(null, 2)).toBe("/kegiatan/ppks?hal=2");
  });

  it("is read back as what it was made from", () => {
    expect(readAddress(scheduleListAddress(4, 7))).toEqual({
      level: 4,
      page: 7,
    });
    expect(readAddress(scheduleListAddress(null))).toEqual({
      level: null,
      page: 1,
    });
  });
});
