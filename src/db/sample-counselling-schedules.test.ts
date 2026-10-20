import { describe, expect, it } from "vitest";
import { SCHEDULE_STATUSES } from "@/features/counselling/schedule-ids";
import { SAMPLE_CONSENTS } from "./sample-counselling-consents";
import {
  isStudentScheduleStep,
  SAMPLE_SCHEDULES,
} from "./sample-counselling-schedules";
import { SAMPLE_STUDENTS } from "./sample-data";

const NIMS = new Set(SAMPLE_STUDENTS.map((student) => student.nim));

describe("the sample requests for counselling", () => {
  it.each(SAMPLE_SCHEDULES)(
    "name a sample student once, start by registering, with steps oldest first: $nim",
    (sample) => {
      expect(NIMS.has(sample.nim)).toBe(true);
      const times = SAMPLE_SCHEDULES.filter((each) => each.nim === sample.nim);
      expect(times).toHaveLength(1);
      expect(sample.steps[0]?.step).toBe("register");
      const days = sample.steps.map((step) => step.daysAgo);
      expect(days).toEqual([...days].sort((one, other) => other - one));
      expect(sample.inDays).toBeGreaterThan(0);
    },
  );

  it("end in every status", () => {
    const lasts = SAMPLE_SCHEDULES.map((sample) => sample.steps.at(-1));
    for (const status of SCHEDULE_STATUSES) {
      expect(lasts.some((step) => step?.statusAfter === status)).toBe(true);
    }
  });

  it("are each of a student whose consent is Disetujui", () => {
    for (const sample of SAMPLE_SCHEDULES) {
      const consent = SAMPLE_CONSENTS.find((each) => each.nim === sample.nim);
      expect(consent?.steps.at(-1)?.status, sample.nim).toBe("approved");
    }
  });

  it("leave approving and proposing to Konselor, and the rest to the student", () => {
    expect(isStudentScheduleStep("register")).toBe(true);
    expect(isStudentScheduleStep("accept")).toBe(true);
    expect(isStudentScheduleStep("ask_another")).toBe(true);
    expect(isStudentScheduleStep("approve")).toBe(false);
    expect(isStudentScheduleStep("propose")).toBe(false);
  });
});
