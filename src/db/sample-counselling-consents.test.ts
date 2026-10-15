import { describe, expect, it } from "vitest";
import { CONSENT_STATUSES } from "@/features/counselling/consent-ids";
import {
  isStudentStep,
  SAMPLE_CONSENTS,
  SAMPLE_COUNSELLOR,
} from "./sample-counselling-consents";
import { SAMPLE_ACCOUNTS, SAMPLE_STUDENTS } from "./sample-data";

const NIMS = new Set(SAMPLE_STUDENTS.map((student) => student.nim));

describe("the sample consents to counselling", () => {
  it.each(SAMPLE_CONSENTS)(
    "name a sample student once, with changes oldest first: $nim",
    (sample) => {
      expect(NIMS.has(sample.nim)).toBe(true);
      const times = SAMPLE_CONSENTS.filter((each) => each.nim === sample.nim);
      expect(times).toHaveLength(1);
      const days = sample.steps.map((step) => step.daysAgo);
      expect(days.length).toBeGreaterThan(0);
      expect(days).toEqual([...days].sort((one, other) => other - one));
    },
  );

  it("end in every status, Disetujui both online and on paper", () => {
    const lasts = SAMPLE_CONSENTS.map((sample) => sample.steps.at(-1));
    for (const status of CONSENT_STATUSES) {
      expect(lasts.some((step) => step?.status === status)).toBe(true);
    }
    expect(lasts).toContainEqual(
      expect.objectContaining({ status: "approved", way: "online" }),
    );
    expect(lasts).toContainEqual(
      expect.objectContaining({ status: "approved", way: "paper" }),
    );
  });

  it("give a way only to a Disetujui", () => {
    for (const sample of SAMPLE_CONSENTS) {
      for (const step of sample.steps) {
        expect(step.way !== null).toBe(step.status === "approved");
      }
    }
  });

  it("are asked for by a sample account that is Konselor", () => {
    const counsellor = SAMPLE_ACCOUNTS.find(
      (account) => account.name === SAMPLE_COUNSELLOR,
    );
    expect(counsellor?.roles).toContain("counsellor");
  });

  it("leave a request and a paper form to Konselor, and the answers to the student", () => {
    expect(isStudentStep({ status: "waiting", way: null, daysAgo: 1 })).toBe(
      false,
    );
    expect(
      isStudentStep({ status: "approved", way: "paper", daysAgo: 1 }),
    ).toBe(false);
    expect(
      isStudentStep({ status: "approved", way: "online", daysAgo: 1 }),
    ).toBe(true);
    expect(isStudentStep({ status: "declined", way: null, daysAgo: 1 })).toBe(
      true,
    );
    expect(isStudentStep({ status: "withdrawn", way: null, daysAgo: 1 })).toBe(
      true,
    );
  });
});
