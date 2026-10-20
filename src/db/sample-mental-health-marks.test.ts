import { describe, expect, it } from "vitest";
import {
  MARK_CATEGORIES,
  OBSERVATION_MAX,
} from "@/features/dorm/mental-health-mark-ids";
import { SAMPLE_DORM_HEALTH_NOTES } from "./sample-health-notes";
import { SAMPLE_MENTAL_HEALTH_MARKS } from "./sample-mental-health-marks";

const NOTED = new Set(SAMPLE_DORM_HEALTH_NOTES.map((note) => note.resident));

describe("the sample mental health marks", () => {
  it("are one of each kind, one resident each", () => {
    const kinds = SAMPLE_MENTAL_HEALTH_MARKS.map((mark) => mark.category);
    expect(new Set(kinds)).toEqual(new Set(MARK_CATEGORIES));
    const residents = SAMPLE_MENTAL_HEALTH_MARKS.map((mark) => mark.resident);
    expect(new Set(residents).size).toBe(residents.length);
  });

  it.each(SAMPLE_MENTAL_HEALTH_MARKS)(
    "hold an observation within its length: resident $resident",
    (mark) => {
      expect(mark.observation).not.toBe("");
      expect(mark.observation.length).toBeLessThanOrEqual(OBSERVATION_MAX);
    },
  );

  it("mark a mentee of the sample Pengasuh, and a resident with no health note", () => {
    const residents = SAMPLE_MENTAL_HEALTH_MARKS.map((mark) => mark.resident);
    expect(residents.some((resident) => resident < 2)).toBe(true);
    expect(residents.some((resident) => !NOTED.has(resident))).toBe(true);
  });

  it("are set by BAM - Kesehatan and Kepala Unit, who write the marks", () => {
    const writers = new Set(SAMPLE_MENTAL_HEALTH_MARKS.map((m) => m.savedAs));
    expect([...writers].sort()).toEqual(["bam_health", "head_of_unit"]);
  });
});
