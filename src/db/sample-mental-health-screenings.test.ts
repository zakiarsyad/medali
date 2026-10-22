import { describe, expect, it } from "vitest";
import {
  INSTRUMENTS,
  SCREENING_LEVELS,
  SCREENING_NOTE_MAX,
} from "@/mental-health/screening-ids";
import { SAMPLE_CONSENTS } from "./sample-counselling-consents";
import { SAMPLE_STUDENTS } from "./sample-data";
import { SAMPLE_SCREENINGS } from "./sample-mental-health-screenings";

const NIMS = new Set(SAMPLE_STUDENTS.map((student) => student.nim));

/** The status of a sample student's consent on a day some days ago. */
function consentOn(nim: string, daysAgo: number): string | null {
  const consent = SAMPLE_CONSENTS.find((each) => each.nim === nim);
  const steps = consent?.steps ?? [];
  const before = steps.filter((step) => step.daysAgo >= daysAgo);
  return before.at(-1)?.status ?? null;
}

function currentConsent(nim: string): string | null {
  return consentOn(nim, 0);
}

describe("the sample mental health screenings", () => {
  it.each(SAMPLE_SCREENINGS)(
    "are of a sample student whose consent was Disetujui that day: $nim, $daysAgo days ago",
    (sample) => {
      expect(NIMS.has(sample.nim)).toBe(true);
      expect(consentOn(sample.nim, sample.daysAgo)).toBe("approved");
      expect(sample.note.length).toBeLessThanOrEqual(SCREENING_NOTE_MAX);
    },
  );

  it("use both instruments and give every level, one with self-harm", () => {
    const instruments = new Set(
      SAMPLE_SCREENINGS.map((each) => each.instrument),
    );
    expect([...instruments].sort()).toEqual([...INSTRUMENTS].sort());
    const levels = new Set(SAMPLE_SCREENINGS.map((each) => each.level));
    expect([...levels].sort()).toEqual([...SCREENING_LEVELS].sort());
    expect(SAMPLE_SCREENINGS.some((each) => each.selfHarm)).toBe(true);
  });

  it("screen one student twice, and one who now waits for consent", () => {
    const nims = SAMPLE_SCREENINGS.map((each) => each.nim);
    expect(new Set(nims).size).toBeLessThan(nims.length);
    expect(nims.some((nim) => currentConsent(nim) === "waiting")).toBe(true);
  });
});
