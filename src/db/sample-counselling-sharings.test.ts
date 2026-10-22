import { describe, expect, it } from "vitest";
import {
  isCurrentSharing,
  sharingAfter,
} from "@/features/counselling/sharing-rules";
import {
  SHARING_RECIPIENTS,
  SHARING_STATUSES,
  type SharingStatus,
  SUMMARY_MAX,
  SUMMARY_MIN,
} from "@/mental-health/sharing-ids";
import { SAMPLE_CONSENTS } from "./sample-counselling-consents";
import { SAMPLE_SESSIONS } from "./sample-counselling-sessions";
import {
  SAMPLE_SHARINGS,
  type SampleSharing,
} from "./sample-counselling-sharings";
import { SAMPLE_STUDENTS } from "./sample-data";

const NIMS = new Set(SAMPLE_STUDENTS.map((student) => student.nim));

/** The status of a sample student's consent that many days ago. */
function consentThen(nim: string, daysAgo: number): string | null {
  const consent = SAMPLE_CONSENTS.find((each) => each.nim === nim);
  const before = consent?.steps.filter((step) => step.daysAgo >= daysAgo);
  return before?.at(-1)?.status ?? null;
}

/** Each status a sample sharing goes through, or null for a step refused. */
function statusesOf(sample: SampleSharing): (SharingStatus | null)[] {
  const statuses: (SharingStatus | null)[] = [];
  let current: SharingStatus | null = null;
  for (const { step } of sample.steps) {
    current = sharingAfter(step, current);
    statuses.push(current);
  }
  return statuses;
}

function lastStatus(sample: SampleSharing): SharingStatus | null {
  return statusesOf(sample).at(-1) ?? null;
}

describe("the sample sharings of counselling data", () => {
  it.each(SAMPLE_SHARINGS)(
    "name a sample student, start with a request, and take each step from the status before: $nim",
    (sample) => {
      expect(NIMS.has(sample.nim)).toBe(true);
      expect(sample.steps[0]?.step).toBe("ask");
      expect(statusesOf(sample)).not.toContain(null);
      const days = sample.steps.map((step) => step.daysAgo);
      expect(days).toEqual([...days].sort((one, other) => other - one));
    },
  );

  it.each(SAMPLE_SHARINGS)(
    "are asked for after a session, while the consent is Disetujui: $nim",
    (sample) => {
      const asked = sample.steps[0]?.daysAgo ?? 0;
      const earlier = SAMPLE_SESSIONS.filter(
        (session) => session.nim === sample.nim && session.daysAgo >= asked,
      );
      expect(earlier.length).toBeGreaterThan(0);
      expect(consentThen(sample.nim, asked)).toBe("approved");
    },
  );

  it("stop on the day the consent is withdrawn, and only then", () => {
    for (const sample of SAMPLE_SHARINGS) {
      for (const step of sample.steps) {
        if (step.step !== "consent_withdrawn") continue;
        expect(consentThen(sample.nim, step.daysAgo)).toBe("withdrawn");
        expect(consentThen(sample.nim, step.daysAgo + 1)).toBe("approved");
      }
    }
  });

  it("end in every status, with at most one current sharing per student", () => {
    const lasts = SAMPLE_SHARINGS.map(lastStatus);
    for (const status of SHARING_STATUSES) {
      expect(lasts).toContain(status);
    }
    const current = SAMPLE_SHARINGS.filter((sample) => {
      const last = lastStatus(sample);
      return last !== null && isCurrentSharing(last);
    }).map((sample) => sample.nim);
    expect(new Set(current).size).toBe(current.length);
  });

  it("publish to each of the four recipients, so each can read Data yang dipublikasikan untuk Anda", () => {
    const published = SAMPLE_SHARINGS.filter(
      (sample) => lastStatus(sample) === "published",
    );
    for (const recipient of SHARING_RECIPIENTS) {
      const named = published.filter((sample) =>
        sample.recipients.includes(recipient),
      );
      expect(named.length, recipient).toBeGreaterThan(0);
    }
  });

  it("hold a summary only when it is shared, within its length, and some data and recipient", () => {
    for (const sample of SAMPLE_SHARINGS) {
      expect(sample.data.length).toBeGreaterThan(0);
      expect(sample.recipients.length).toBeGreaterThan(0);
      expect(sample.summary !== null).toBe(sample.data.includes("summary"));
      if (sample.summary === null) continue;
      expect(sample.summary.trim().length).toBeGreaterThanOrEqual(SUMMARY_MIN);
      expect(sample.summary.length).toBeLessThanOrEqual(SUMMARY_MAX);
    }
  });
});
