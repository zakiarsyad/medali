import { describe, expect, it } from "vitest";
import {
  readScheduleListParams,
  scheduleListAddress,
} from "./schedule-list-address";

function readAddress(address: string) {
  const search = new URL(address, "http://localhost").searchParams;
  return readScheduleListParams(Object.fromEntries(search));
}

const SCHEDULE_ID = "00000000-0000-4000-8000-000000000001";

describe("readScheduleListParams", () => {
  it("opens the first page of every tahap with nothing chosen", () => {
    expect(readScheduleListParams({})).toEqual({
      level: null,
      page: 1,
      open: null,
    });
  });

  it("reads the tahap and the page", () => {
    expect(readScheduleListParams({ tahap: "3", hal: "2" })).toEqual({
      level: 3,
      page: 2,
      open: null,
    });
  });

  it("reads the schedule whose Peserta is open, and the page of its students", () => {
    expect(readScheduleListParams({ peserta: SCHEDULE_ID }).open).toEqual({
      scheduleId: SCHEDULE_ID,
      page: 1,
    });
    expect(
      readScheduleListParams({ peserta: SCHEDULE_ID, halPeserta: "3" }).open,
    ).toEqual({ scheduleId: SCHEDULE_ID, page: 3 });
  });

  it("opens no Peserta for what is not the key of a schedule, whatever page is named", () => {
    for (const peserta of ["", "semua", "1", "' or 1=1"]) {
      expect(
        readScheduleListParams({ peserta, halPeserta: "2" }).open,
      ).toBeNull();
    }
    expect(readScheduleListParams({ halPeserta: "2" }).open).toBeNull();
  });

  it.each(["0", "-2", "1.5", "dua", ""])(
    "takes the page %j of the students as the first page",
    (halPeserta) => {
      const params = readScheduleListParams({
        peserta: SCHEDULE_ID,
        halPeserta,
      });

      expect(params.open?.page).toBe(1);
    },
  );

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
      open: null,
    });
    expect(readAddress(scheduleListAddress(null))).toEqual({
      level: null,
      page: 1,
      open: null,
    });
    const open = { scheduleId: SCHEDULE_ID, page: 2 };
    expect(readAddress(scheduleListAddress(3, 2, open))).toEqual({
      level: 3,
      page: 2,
      open,
    });
  });

  it("names the schedule whose Peserta is open, and the page of its students only after the first", () => {
    expect(
      scheduleListAddress(null, 1, { scheduleId: SCHEDULE_ID, page: 1 }),
    ).toBe(`/kegiatan/ppks?peserta=${SCHEDULE_ID}`);
    expect(
      scheduleListAddress(2, 3, { scheduleId: SCHEDULE_ID, page: 4 }),
    ).toBe(`/kegiatan/ppks?tahap=2&hal=3&peserta=${SCHEDULE_ID}&halPeserta=4`);
  });
});
