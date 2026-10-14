import { describe, expect, it } from "vitest";
import { runningPeriodOn } from "@/academic-periods/running-period";
import { uploadDeadline } from "@/features/activities/upload-range";
import {
  SAMPLE_SPECIAL_ACTIVITIES,
  SAMPLE_STUDENTS,
  samplePeriods,
} from "./sample-data";
import { sampleExtraSchedules } from "./sample-extra-schedules";

const DAY = "2026-10-13";
const PERIODS = samplePeriods(DAY);
const schedules = sampleExtraSchedules(DAY, PERIODS);

describe("sampleExtraSchedules", () => {
  it("holds each of the two sample special activities once: one whose upload is over, one whose upload is open", () => {
    const names = schedules.map((schedule) => schedule.activityName);
    const deadlines = schedules.map((schedule) => uploadDeadline(schedule));

    expect(names).toEqual(
      SAMPLE_SPECIAL_ACTIVITIES.map((activity) => activity.name),
    );
    expect(deadlines.filter((deadline) => deadline < DAY)).toHaveLength(1);
    expect(deadlines.filter((deadline) => deadline >= DAY)).toHaveLength(1);
  });

  it("gives each the period that runs on its first day", () => {
    for (const schedule of schedules) {
      expect(schedule.period).toBe(runningPeriodOn(PERIODS, schedule.startsOn));
    }
  });

  it("is for two angkatan in one and two classes in the other, each of which has Aktif sample students", () => {
    const active = SAMPLE_STUDENTS.filter(
      (student) => (student.status ?? "active") === "active",
    );
    const kinds = schedules.map((schedule) =>
      schedule.participants.map((participant) => Object.keys(participant)[0]),
    );

    expect(kinds).toEqual([
      ["cohortYear", "cohortYear"],
      ["className", "className"],
    ]);
    for (const schedule of schedules) {
      for (const participant of schedule.participants) {
        const isNamed = active.some((student) =>
          "className" in participant
            ? student.className === participant.className
            : student.cohortYear === participant.cohortYear,
        );
        expect(isNamed).toBe(true);
      }
    }
  });
});
