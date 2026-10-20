import { describe, expect, it } from "vitest";
import {
  ACTIVE_STATUSES,
  SCHEDULE_STATUSES,
} from "@/features/counselling/schedule-ids";
import { SAMPLE_CONSENTS } from "./sample-counselling-consents";
import {
  isStudentScheduleStep,
  SAMPLE_SCHEDULES,
} from "./sample-counselling-schedules";
import { SAMPLE_STUDENTS } from "./sample-data";

const NIMS = new Set(SAMPLE_STUDENTS.map((student) => student.nim));

describe("the sample requests for counselling", () => {
  it.each(SAMPLE_SCHEDULES)(
    "name a sample student, start by registering, with steps oldest first: $nim",
    (sample) => {
      expect(NIMS.has(sample.nim)).toBe(true);
      expect(sample.steps[0]?.step).toBe("register");
      const days = sample.steps.map((step) => step.daysAgo);
      expect(days).toEqual([...days].sort((one, other) => other - one));
    },
  );

  it("are about a coming day while waiting, and a day gone by once finished", () => {
    for (const sample of SAMPLE_SCHEDULES) {
      const status = sample.steps.at(-1)?.statusAfter ?? "submitted";
      if (status === "scheduled") continue;
      const isActive = ACTIVE_STATUSES.includes(status);
      expect(sample.inDays > 0, sample.nim).toBe(isActive);
    }
  });

  it("hold a Dijadwalkan session whose day has come, for Konselor to mark", () => {
    const due = SAMPLE_SCHEDULES.filter(
      (sample) =>
        sample.steps.at(-1)?.statusAfter === "scheduled" && sample.inDays < 0,
    );
    expect(due).toHaveLength(1);
  });

  it("give each student at most one active request, and one of each status", () => {
    const actives = SAMPLE_SCHEDULES.filter((sample) =>
      ACTIVE_STATUSES.includes(sample.steps.at(-1)?.statusAfter ?? "done"),
    ).map((sample) => sample.nim);
    expect(new Set(actives).size).toBe(actives.length);
    const kinds = SAMPLE_SCHEDULES.map(
      (sample) => `${sample.nim} ${sample.steps.at(-1)?.statusAfter}`,
    );
    expect(new Set(kinds).size).toBe(kinds.length);
  });

  it("end in every status", () => {
    const lasts = SAMPLE_SCHEDULES.map((sample) => sample.steps.at(-1));
    for (const status of SCHEDULE_STATUSES) {
      expect(lasts.some((step) => step?.statusAfter === status)).toBe(true);
    }
  });

  it("are each of a student who gave their consent", () => {
    for (const sample of SAMPLE_SCHEDULES) {
      const consent = SAMPLE_CONSENTS.find((each) => each.nim === sample.nim);
      const gave = consent?.steps.some((step) => step.status === "approved");
      expect(gave, sample.nim).toBe(true);
    }
  });

  it("leave approving, proposing, moving and marking to Konselor, and the rest to the student", () => {
    for (const step of [
      "register",
      "accept",
      "ask_another",
      "cancel",
    ] as const) {
      expect(isStudentScheduleStep(step)).toBe(true);
    }
    for (const step of [
      "approve",
      "propose",
      "reschedule",
      "mark_done",
      "mark_missed",
    ] as const) {
      expect(isStudentScheduleStep(step)).toBe(false);
    }
  });
});
