import { describe, expect, it } from "vitest";
import { runningPeriodOn } from "@/academic-periods/running-period";
import { levelOf } from "@/academic-periods/stages";
import { sampleActivitySchedules } from "./sample-activity-schedules";
import { SAMPLE_PPKS_ACTIVITIES, samplePeriods } from "./sample-data";

const DAY = "2026-10-13";
const PERIODS = samplePeriods(DAY);
const schedules = sampleActivitySchedules(DAY, PERIODS);

function semesterOf(activityName: string): number {
  const activity = SAMPLE_PPKS_ACTIVITIES.find(
    (each) => each.name === activityName,
  );
  if (!activity) throw new Error(`No sample activity ${activityName}.`);
  return activity.semester;
}

describe("sampleActivitySchedules", () => {
  it("has schedules that are over, some that run or wait for photos today, and some to come", () => {
    const over = schedules.filter((schedule) => schedule.endsOn < DAY);
    const today = schedules.filter(
      (schedule) => schedule.startsOn <= DAY && schedule.endsOn >= DAY,
    );
    const coming = schedules.filter((schedule) => schedule.startsOn > DAY);

    expect(over.length).toBeGreaterThan(1);
    expect(today.length).toBeGreaterThan(1);
    expect(coming.length).toBeGreaterThan(1);
  });

  it("names only sample PPKS activities, of more than one tahap", () => {
    const levels = schedules.map((schedule) =>
      levelOf(semesterOf(schedule.activityName)),
    );

    expect(new Set(levels).size).toBeGreaterThan(1);
  });

  it("gives each the period that runs on its first day, and reaches an earlier period", () => {
    for (const schedule of schedules) {
      expect(schedule.period).toBe(runningPeriodOn(PERIODS, schedule.startsOn));
    }
    expect(new Set(schedules.map((schedule) => schedule.period)).size).toBe(2);
  });

  it("holds an activity only in a period where its semester is taught", () => {
    for (const schedule of schedules) {
      const isOddSemester = semesterOf(schedule.activityName) % 2 === 1;

      expect(isOddSemester).toBe(schedule.period.term === "odd");
    }
  });

  it("ends each on or after its first day, and after its first hour", () => {
    for (const schedule of schedules) {
      expect(schedule.endsOn >= schedule.startsOn).toBe(true);
      expect(schedule.endTime > schedule.startTime).toBe(true);
    }
  });

  it("moves with the day it is made for", () => {
    const later = sampleActivitySchedules("2027-03-02", PERIODS);

    expect(later.map((schedule) => schedule.startsOn)).not.toEqual(
      schedules.map((schedule) => schedule.startsOn),
    );
  });
});
