import { describe, expect, it } from "vitest";
import { daysAfter } from "@/academic-periods/days-after";
import { uploadDeadline } from "@/features/activities/upload-range";
import {
  sampleActivityAttendances,
  takesClarifications,
} from "./sample-activity-attendances";
import { sampleClarifications } from "./sample-activity-clarifications";
import {
  sampleActivitySchedules,
  secondYearCohort,
} from "./sample-activity-schedules";
import { SAMPLE_STUDENTS, samplePeriods } from "./sample-data";

const DAY = "2026-10-13";
const PERIODS = samplePeriods(DAY);
const schedules = sampleActivitySchedules(DAY, PERIODS);
const attendances = sampleActivityAttendances(schedules, SAMPLE_STUDENTS, DAY);
const clarifications = sampleClarifications(
  schedules,
  SAMPLE_STUDENTS,
  attendances,
  DAY,
);

const firstSecondYear = SAMPLE_STUDENTS.find(
  (student) =>
    student.cohortYear === secondYearCohort(DAY, PERIODS) &&
    (student.status ?? "active") === "active",
);
if (!firstSecondYear) throw new Error("No sample student is in year two.");
const ofFirst = clarifications.filter(({ nim }) => nim === firstSecondYear.nim);

function attendanceAt(nim: string, schedule: (typeof schedules)[number]) {
  return attendances.find(
    (each) => each.nim === nim && each.schedule === schedule,
  );
}

describe("takesClarifications", () => {
  const schedule = schedules.find((each) => uploadDeadline(each) < DAY);
  if (!schedule) throw new Error("No sample schedule has closed.");
  const lastUploadDay = uploadDeadline(schedule);

  it("is no while photos are still taken", () => {
    expect(takesClarifications(schedule, lastUploadDay)).toBe(false);
  });

  it("is yes from the day after the last upload day to the seventh day after it", () => {
    expect(takesClarifications(schedule, daysAfter(lastUploadDay, 1))).toBe(
      true,
    );
    expect(takesClarifications(schedule, daysAfter(lastUploadDay, 7))).toBe(
      true,
    );
  });

  it("is no from the eighth day on", () => {
    expect(takesClarifications(schedule, daysAfter(lastUploadDay, 8))).toBe(
      false,
    );
  });
});

describe("sampleClarifications", () => {
  it("has clarifications that wait, were rejected, and were accepted as present and as a dispensation", () => {
    const kinds = new Set(
      clarifications.map(({ status, acceptedAs }) => `${status} ${acceptedAs}`),
    );

    expect([...kinds].sort()).toEqual([
      "accepted dispensation",
      "accepted valid",
      "rejected null",
      "submitted null",
    ]);
  });

  it("is only for a student who was absent or whose photo was rejected, once the upload time has closed", () => {
    for (const { nim, schedule } of clarifications) {
      const status = attendanceAt(nim, schedule)?.status ?? null;

      expect([null, "rejected"]).toContain(status);
      expect(uploadDeadline(schedule) < DAY).toBe(true);
    }
  });

  it("waits only where a clarification can still be sent", () => {
    const waiting = clarifications.filter(
      ({ status }) => status === "submitted",
    );

    expect(waiting.length).toBeGreaterThan(1);
    for (const { schedule } of waiting) {
      expect(takesClarifications(schedule, DAY)).toBe(true);
    }
  });

  it("is once for a student and a schedule at most", () => {
    const seen = new Set<string>();
    for (const { nim, schedule } of clarifications) {
      const key = `${nim} ${schedules.indexOf(schedule)}`;

      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it("is sent and decided before the day, and decided unless it waits", () => {
    const startOfDay = new Date(`${DAY}T00:00:00+07:00`);
    for (const { status, sentAt, decidedAt, schedule } of clarifications) {
      expect(sentAt < startOfDay).toBe(true);
      const closedAt = new Date(`${uploadDeadline(schedule)}T23:59:59+07:00`);
      expect(sentAt > closedAt).toBe(true);
      expect(decidedAt === null).toBe(status === "submitted");
      if (decidedAt === null) continue;
      expect(decidedAt > sentAt).toBe(true);
      expect(decidedAt < startOfDay).toBe(true);
    }
  });

  it("has a note with every rejection, and an explanation of at least ten letters", () => {
    for (const { status, note, explanation } of clarifications) {
      if (status === "rejected") expect(note).not.toBe("");
      expect(explanation.trim().length).toBeGreaterThanOrEqual(10);
    }
  });

  it("is of students of more than one program and angkatan", () => {
    const nims = new Set(clarifications.map(({ nim }) => nim));
    const asking = SAMPLE_STUDENTS.filter(({ nim }) => nims.has(nim));

    expect(
      new Set(asking.map((each) => each.studyProgram)).size,
    ).toBeGreaterThan(2);
    expect(new Set(asking.map((each) => each.cohortYear)).size).toBeGreaterThan(
      1,
    );
  });

  it("gives the first second-year student one that waits, one rejected that can be asked again, and an accepted one", () => {
    const open = ofFirst.filter(({ schedule }) =>
      takesClarifications(schedule, DAY),
    );

    expect(open.map(({ status }) => status).sort()).toEqual([
      "rejected",
      "submitted",
    ]);
    expect(ofFirst.some(({ status }) => status === "accepted")).toBe(true);
  });

  it("leaves the first second-year student a schedule they can still ask a clarification for", () => {
    const asked = new Set(ofFirst.map(({ schedule }) => schedule));
    const left = schedules.filter(
      (schedule) =>
        schedule.activityName === "Latihan dasar kepemimpinan organisasi" &&
        takesClarifications(schedule, DAY) &&
        !asked.has(schedule) &&
        [undefined, "rejected"].includes(
          attendanceAt(firstSecondYear.nim, schedule)?.status,
        ),
    );

    expect(left.length).toBeGreaterThan(0);
  });
});
