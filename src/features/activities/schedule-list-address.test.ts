import { describe, expect, it } from "vitest";
import {
  readScheduleListParams,
  type ScheduleKind,
  type ScheduleScope,
  scheduleListAddress,
} from "./schedule-list-address";

function readAddress(address: string, kind: ScheduleKind = "ppks") {
  const search = new URL(address, "http://localhost").searchParams;
  return readScheduleListParams(Object.fromEntries(search), kind);
}

function ppks(level: number | null): ScheduleScope {
  return { kind: "ppks", level };
}

const EXTRA: ScheduleScope = { kind: "extra" };

const SCHEDULE_ID = "00000000-0000-4000-8000-000000000001";

function readPpks(params: Record<string, string | string[]>) {
  return readScheduleListParams(params, "ppks");
}

describe("readScheduleListParams", () => {
  it("opens the first page of every tahap with nothing chosen", () => {
    expect(readPpks({})).toEqual({ scope: ppks(null), page: 1, open: null });
  });

  it("reads the tahap and the page", () => {
    expect(readPpks({ tahap: "3", hal: "2" })).toEqual({
      scope: ppks(3),
      page: 2,
      open: null,
    });
  });

  it("reads no tahap on the tab of the extra activities, which has none", () => {
    expect(readScheduleListParams({ tahap: "3", hal: "2" }, "extra")).toEqual({
      scope: EXTRA,
      page: 2,
      open: null,
    });
  });

  it("reads the schedule whose Peserta is open, and the page of its students", () => {
    expect(readPpks({ peserta: SCHEDULE_ID }).open).toEqual({
      scheduleId: SCHEDULE_ID,
      page: 1,
    });
    expect(readPpks({ peserta: SCHEDULE_ID, halPeserta: "3" }).open).toEqual({
      scheduleId: SCHEDULE_ID,
      page: 3,
    });
  });

  it("opens no Peserta for what is not the key of a schedule, whatever page is named", () => {
    for (const peserta of ["", "semua", "1", "' or 1=1"]) {
      expect(readPpks({ peserta, halPeserta: "2" }).open).toBeNull();
    }
    expect(readPpks({ halPeserta: "2" }).open).toBeNull();
  });

  it.each(["0", "-2", "1.5", "dua", ""])(
    "takes the page %j of the students as the first page",
    (halPeserta) => {
      const params = readPpks({ peserta: SCHEDULE_ID, halPeserta });

      expect(params.open?.page).toBe(1);
    },
  );

  it.each(["0", "5", "12", "-1", "1.5", "dua", " 2", ""])(
    "takes the tahap %j as not chosen",
    (tahap) => {
      expect(readPpks({ tahap }).scope).toEqual(ppks(null));
    },
  );

  it.each(["0", "-2", "1.5", "dua", "1234567", ""])(
    "takes the page %j as the first page",
    (hal) => {
      expect(readPpks({ hal }).page).toBe(1);
    },
  );

  it("takes the first of a part that is given twice", () => {
    expect(readPpks({ tahap: ["2", "4"] }).scope).toEqual(ppks(2));
  });
});

describe("scheduleListAddress", () => {
  it("is the tab itself for every tahap on the first page", () => {
    expect(scheduleListAddress(ppks(null))).toBe("/kegiatan/ppks");
  });

  it("names the tahap, and the page only after the first", () => {
    expect(scheduleListAddress(ppks(2))).toBe("/kegiatan/ppks?tahap=2");
    expect(scheduleListAddress(ppks(2), 3)).toBe(
      "/kegiatan/ppks?tahap=2&hal=3",
    );
    expect(scheduleListAddress(ppks(null), 2)).toBe("/kegiatan/ppks?hal=2");
  });

  it("leads to the tab of the extra activities, with no tahap", () => {
    expect(scheduleListAddress(EXTRA)).toBe("/kegiatan/tambahan");
    expect(scheduleListAddress(EXTRA, 2)).toBe("/kegiatan/tambahan?hal=2");
  });

  it("is read back as what it was made from", () => {
    expect(readAddress(scheduleListAddress(ppks(4), 7))).toEqual({
      scope: ppks(4),
      page: 7,
      open: null,
    });
    expect(readAddress(scheduleListAddress(ppks(null)))).toEqual({
      scope: ppks(null),
      page: 1,
      open: null,
    });
    const open = { scheduleId: SCHEDULE_ID, page: 2 };
    expect(readAddress(scheduleListAddress(ppks(3), 2, open))).toEqual({
      scope: ppks(3),
      page: 2,
      open,
    });
    expect(readAddress(scheduleListAddress(EXTRA, 2, open), "extra")).toEqual({
      scope: EXTRA,
      page: 2,
      open,
    });
  });

  it("names the schedule whose Peserta is open, and the page of its students only after the first", () => {
    expect(
      scheduleListAddress(ppks(null), 1, { scheduleId: SCHEDULE_ID, page: 1 }),
    ).toBe(`/kegiatan/ppks?peserta=${SCHEDULE_ID}`);
    expect(
      scheduleListAddress(ppks(2), 3, { scheduleId: SCHEDULE_ID, page: 4 }),
    ).toBe(`/kegiatan/ppks?tahap=2&hal=3&peserta=${SCHEDULE_ID}&halPeserta=4`);
  });
});
