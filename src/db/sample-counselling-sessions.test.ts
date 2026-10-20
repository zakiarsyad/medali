import { describe, expect, it } from "vitest";
import { SESSION_NOTES_MAX } from "@/features/counselling/session-ids";
import { SAMPLE_CONSENTS } from "./sample-counselling-consents";
import { SAMPLE_SCHEDULES } from "./sample-counselling-schedules";
import { SAMPLE_SESSIONS } from "./sample-counselling-sessions";
import { SAMPLE_STUDENTS } from "./sample-data";

const NIMS = new Set(SAMPLE_STUDENTS.map((student) => student.nim));

/** The status of a sample student's consent that many days ago. */
function consentThen(nim: string, daysAgo: number): string | null {
  const consent = SAMPLE_CONSENTS.find((each) => each.nim === nim);
  const before = consent?.steps.filter((step) => step.daysAgo >= daysAgo);
  return before?.at(-1)?.status ?? null;
}

function sessionsOf(nim: string) {
  return SAMPLE_SESSIONS.filter((session) => session.nim === nim);
}

describe("the sample counselling sessions", () => {
  it.each(SAMPLE_SESSIONS)(
    "name a sample student whose consent was Disetujui when it was written: $nim, $daysAgo days ago",
    (session) => {
      expect(NIMS.has(session.nim)).toBe(true);
      expect(session.daysAgo).toBeGreaterThan(0);
      expect(consentThen(session.nim, session.daysAgo)).toBe("approved");
    },
  );

  it("are written for a Selesai session of the student only on the day it was marked, one each", () => {
    const written = SAMPLE_SESSIONS.filter((each) => each.forDoneSchedule);
    expect(written.length).toBeGreaterThan(0);
    for (const session of written) {
      const done = SAMPLE_SCHEDULES.filter(
        (each) =>
          each.nim === session.nim && each.steps.at(-1)?.statusAfter === "done",
      );
      expect(done).toHaveLength(1);
      expect(done[0]?.steps.at(-1)?.daysAgo).toBe(session.daysAgo);
    }
    const nims = written.map((each) => each.nim);
    expect(new Set(nims).size).toBe(nims.length);
  });

  it("hold notes, within the longest kept, and a next session after the day", () => {
    for (const session of SAMPLE_SESSIONS) {
      expect(session.notes.trim().length).toBeGreaterThan(0);
      expect(session.notes.length).toBeLessThanOrEqual(SESSION_NOTES_MAX);
      if (session.nextInDays === null) continue;
      expect(session.nextInDays).toBeGreaterThan(-session.daysAgo);
    }
  });

  it("give one student more than 10, so more can be loaded", () => {
    const counts = [...NIMS].map((nim) => sessionsOf(nim).length);
    expect(Math.max(...counts)).toBeGreaterThan(10);
  });

  it("hold one changed after it was written, and past ones of a student who withdrew", () => {
    expect(SAMPLE_SESSIONS.some((each) => each.firstNotes !== null)).toBe(true);
    const withdrawn = SAMPLE_SESSIONS.filter(
      (each) => consentThen(each.nim, 0) === "withdrawn",
    );
    expect(withdrawn.length).toBeGreaterThan(0);
  });
});
