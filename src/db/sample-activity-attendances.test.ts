import { describe, expect, it } from "vitest";
import { uploadDeadline } from "@/features/activities/upload-range";
import { sampleActivityAttendances } from "./sample-activity-attendances";
import {
  sampleActivitySchedules,
  secondYearCohort,
} from "./sample-activity-schedules";
import { SAMPLE_STUDENTS, samplePeriods } from "./sample-data";

const DAY = "2026-10-13";
const PERIODS = samplePeriods(DAY);
const schedules = sampleActivitySchedules(DAY, PERIODS);
const attendances = sampleActivityAttendances(schedules, SAMPLE_STUDENTS, DAY);

const firstSecondYear = SAMPLE_STUDENTS.find(
  (student) =>
    student.cohortYear === secondYearCohort(DAY, PERIODS) &&
    (student.status ?? "active") === "active",
);
if (!firstSecondYear) throw new Error("No sample student is in year two.");
const ofFirst = attendances.filter(({ nim }) => nim === firstSecondYear.nim);

describe("sampleActivityAttendances", () => {
  it("has attendance in every status", () => {
    const statuses = new Set(attendances.map(({ status }) => status));

    expect([...statuses].sort()).toEqual([
      "dispensation",
      "rejected",
      "valid",
      "waiting",
    ]);
  });

  it("gives the first second-year student every status, in the running period too", () => {
    const [running] = PERIODS;
    const now = ofFirst.filter(({ schedule }) => schedule.period === running);

    expect(new Set(ofFirst.map(({ status }) => status)).size).toBe(4);
    expect(new Set(now.map(({ status }) => status)).size).toBe(4);
  });

  it("leaves the first second-year student a closed schedule and an open one with nothing sent", () => {
    const attended = new Set(ofFirst.map(({ schedule }) => schedule));
    const missed = schedules.filter(
      (schedule) =>
        schedule.activityName === "Latihan dasar kepemimpinan organisasi" &&
        schedule.startsOn < DAY &&
        !attended.has(schedule),
    );
    const closed = missed.filter((each) => uploadDeadline(each) < DAY);
    const open = missed.filter((each) => uploadDeadline(each) >= DAY);

    expect(closed.length).toBeGreaterThan(0);
    expect(open.length).toBeGreaterThan(0);
  });

  it("is of Aktif sample students only, once for a schedule at most", () => {
    const active = new Set(
      SAMPLE_STUDENTS.filter(
        (student) => (student.status ?? "active") === "active",
      ).map((student) => student.nim),
    );
    const seen = new Set<string>();
    for (const { nim, schedule } of attendances) {
      const key = `${nim} ${schedules.indexOf(schedule)}`;

      expect(active.has(nim)).toBe(true);
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it("is only at schedules that began before the day", () => {
    for (const { schedule } of attendances) {
      expect(schedule.startsOn < DAY).toBe(true);
    }
  });

  it("waits only where the upload time is still open, and is decided where it is not", () => {
    for (const { schedule, status } of attendances) {
      const isClosed = uploadDeadline(schedule) < DAY;

      expect(status === "waiting").toBe(!isClosed);
    }
  });

  it("has a time sent unless it is a dispensation, and a time decided unless it waits", () => {
    for (const { status, sentAt, decidedAt } of attendances) {
      expect(sentAt === null).toBe(status === "dispensation");
      expect(decidedAt === null).toBe(status === "waiting");
    }
  });
});
