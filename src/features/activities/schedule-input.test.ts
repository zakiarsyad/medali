import { describe, expect, it } from "vitest";
import { parseSchedule, type SentSchedule } from "./schedule-input";
import { SENT_SCHEDULE } from "./test-records";

function errorOf(change: Partial<SentSchedule>): string | null {
  const parsed = parseSchedule({ ...SENT_SCHEDULE, ...change });
  return parsed.ok ? null : parsed.error;
}

describe("parseSchedule", () => {
  it("takes a form with nothing wrong in it, with the count as a number and the place trimmed", () => {
    const parsed = parseSchedule({
      ...SENT_SCHEDULE,
      uploadCount: " 2 ",
      uploadUnit: "week",
      location: "  Aula uji  ",
      isRequired: false,
    });

    expect(parsed).toEqual({
      ok: true,
      value: {
        activityId: SENT_SCHEDULE.activityId,
        startsOn: "2120-09-10",
        endsOn: "2120-09-11",
        startTime: "07:30",
        endTime: "11:30",
        uploadCount: 2,
        uploadUnit: "week",
        location: "Aula uji",
        isRequired: false,
      },
    });
  });

  it.each(["", "pilih", "1", "7c1d2e3f-4a5b-4c6d-8e7f"])(
    "asks for an activity when %j is sent as one",
    (activityId) => {
      expect(errorOf({ activityId })).toBe(
        "Pilih kegiatan dari daftar Kurikulum.",
      );
    },
  );

  it("takes a schedule of one day", () => {
    expect(errorOf({ endsOn: SENT_SCHEDULE.startsOn })).toBeNull();
  });

  it("refuses a last day before the first", () => {
    expect(errorOf({ endsOn: "2120-09-09" })).toBe(
      "Tanggal selesai harus sama atau setelah tanggal mulai.",
    );
  });

  it.each(["", "10-09-2120", "2120-02-30", "2120-13-01", "besok"])(
    "refuses %j as the first day",
    (startsOn) => {
      expect(errorOf({ startsOn })).toBe(
        "Isi tanggal mulai dengan tanggal yang benar.",
      );
    },
  );

  it.each(["", "2120/09/11", "2120-09-31"])(
    "refuses %j as the last day",
    (endsOn) => {
      expect(errorOf({ endsOn })).toBe(
        "Isi tanggal selesai dengan tanggal yang benar.",
      );
    },
  );

  it.each([
    ["11:30", "11:30"],
    ["11:30", "07:30"],
    ["00:01", "00:00"],
  ])(
    "refuses the hours %s to %s: the last is not after the first",
    (startTime, endTime) => {
      expect(errorOf({ startTime, endTime })).toBe(
        "Jam selesai harus setelah jam mulai.",
      );
    },
  );

  it("takes hours one minute apart", () => {
    expect(errorOf({ startTime: "23:58", endTime: "23:59" })).toBeNull();
  });

  it.each(["", "7:30", "24:00", "07:60", "07.30", "07:30:00", "pagi"])(
    "refuses %j as the first hour",
    (startTime) => {
      expect(errorOf({ startTime })).toBe("Isi jam mulai, misalnya 07:30.");
    },
  );

  it.each(["", "25:00", "siang"])("refuses %j as the last hour", (endTime) => {
    expect(errorOf({ endTime })).toBe("Isi jam selesai, misalnya 11:30.");
  });

  it.each(["0", "1", "52"])("takes an upload range of %s", (uploadCount) => {
    expect(errorOf({ uploadCount })).toBeNull();
  });

  it.each(["", "53", "-1", "1.5", "1,5", "100", "dua", "1e1"])(
    "refuses an upload range of %j",
    (uploadCount) => {
      expect(errorOf({ uploadCount })).toBe(
        "Rentang unggah harus bilangan bulat dari 0 sampai 52.",
      );
    },
  );

  it.each(["", "hari", "month", "DAY"])(
    "refuses %j as the unit of the upload range",
    (uploadUnit) => {
      expect(errorOf({ uploadUnit })).toBe(
        "Pilih hari atau minggu untuk rentang unggah.",
      );
    },
  );

  it("takes no place, and a place of 100 characters", () => {
    expect(errorOf({ location: "   " })).toBeNull();
    expect(errorOf({ location: "a".repeat(100) })).toBeNull();
  });

  it("refuses a place of more than 100 characters", () => {
    expect(errorOf({ location: "a".repeat(101) })).toBe(
      "Lokasi paling banyak 100 karakter.",
    );
  });

  it("names the missing activity first, before any other fault", () => {
    expect(errorOf({ activityId: "", endsOn: "2120-09-09" })).toBe(
      "Pilih kegiatan dari daftar Kurikulum.",
    );
  });
});
