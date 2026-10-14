import { describe, expect, it } from "vitest";
import {
  DECISION_NOTE_MAX_LENGTH,
  PHOTOS_MAX,
  PHOTOS_MIN,
  REPORT_MAX_LENGTH,
  REPORT_MIN_LENGTH,
} from "@/features/siku/request-ids";
import { GAIN_REASONS, type SikuReason } from "@/features/siku/siku-ids";
import { SAMPLE_STUDENTS } from "./sample-data";
import { SAMPLE_SIKU_ENTRIES } from "./sample-siku-adjustments";
import { SAMPLE_SIKU_REQUESTS } from "./sample-siku-requests";

const ACTIVE_NIMS = new Set(
  SAMPLE_STUDENTS.filter(
    (student) => (student.status ?? "active") === "active",
  ).map((student) => student.nim),
);

const GAINS: readonly SikuReason[] = GAIN_REASONS;

describe("the sample requests for a SIKU gain", () => {
  it.each(SAMPLE_SIKU_REQUESTS)(
    "name an Aktif sample student, a gain reason, a report and photos the rules allow: $report",
    (request) => {
      expect(ACTIVE_NIMS.has(request.nim)).toBe(true);
      expect(GAINS).toContain(request.reason);
      expect(request.report.length).toBeGreaterThanOrEqual(REPORT_MIN_LENGTH);
      expect(request.report.length).toBeLessThanOrEqual(REPORT_MAX_LENGTH);
      expect(request.photos).toBeGreaterThanOrEqual(PHOTOS_MIN);
      expect(request.photos).toBeLessThanOrEqual(PHOTOS_MAX);
      expect(request.sentDaysAgo).toBeLessThanOrEqual(request.daysAgo);
    },
  );

  it.each(SAMPLE_SIKU_REQUESTS)(
    "are decided or withdrawn only after they were sent, with a note a rejection needs: $report",
    (request) => {
      const { decision } = request;
      if (decision.kind === "rejected") {
        expect(decision.note).not.toBe("");
        expect(decision.note.length).toBeLessThanOrEqual(
          DECISION_NOTE_MAX_LENGTH,
        );
      }
      if (decision.kind === "rejected" || decision.kind === "withdrawn") {
        expect(decision.daysAgo).toBeLessThanOrEqual(request.sentDaysAgo);
      }
    },
  );

  it("approve with a sample gain of their own student, reason and day, given to that student alone", () => {
    for (const request of SAMPLE_SIKU_REQUESTS) {
      const { decision } = request;
      if (decision.kind !== "approved") continue;
      expect(SAMPLE_SIKU_ENTRIES).toContain(decision.gain);
      expect(decision.gain).toMatchObject({
        kind: "gain",
        nims: [request.nim],
        reason: request.reason,
        daysAgo: request.daysAgo,
      });
    }
  });

  it("show every status: waiting, approved, cancelled since, rejected and withdrawn", () => {
    const approved = SAMPLE_SIKU_REQUESTS.flatMap((request) =>
      request.decision.kind === "approved" ? [request.decision.gain] : [],
    );
    const kinds = new Set(SAMPLE_SIKU_REQUESTS.map((r) => r.decision.kind));

    expect([...kinds].sort()).toEqual([
      "approved",
      "rejected",
      "waiting",
      "withdrawn",
    ]);
    expect(approved.some((gain) => gain.cancelledDaysAgo === null)).toBe(true);
    expect(approved.some((gain) => gain.cancelledDaysAgo !== null)).toBe(true);
  });
});
