import { describe, expect, it } from "vitest";
import {
  APPROVED_STATUSES,
  LEAVE_KINDS,
  LEAVE_STATUSES,
  type LeaveStatus,
  REPORT_OPENS_MINUTES,
  REPORT_STATUSES,
} from "@/features/dorm/leave-ids";
import {
  SAMPLE_LEAVE_RESIDENTS,
  sampleDormLeaves,
  sampleReturns,
} from "./sample-dorm-leaves";

const DAY = "2026-10-14";
// 10:00 on campus on that day.
const NOW = new Date("2026-10-14T03:00:00Z");
const leaves = [...sampleDormLeaves(DAY), ...sampleReturns(NOW)];
const reported = leaves.flatMap((leave) =>
  leave.report ? [{ leave, report: leave.report }] : [],
);

describe("sampleDormLeaves", () => {
  it("has requests of every kind and in every status", () => {
    const kinds = new Set(leaves.map((leave) => leave.kind));
    const statuses = new Set(leaves.map((leave) => leave.status));

    expect([...kinds].sort()).toEqual([...LEAVE_KINDS].sort());
    expect([...statuses].sort()).toEqual([...LEAVE_STATUSES].sort());
  });

  it("has approved requests in the week before the day, of each kind", () => {
    const approved: readonly LeaveStatus[] = APPROVED_STATUSES;
    const covering = leaves.filter(
      (leave) =>
        approved.includes(leave.status) &&
        leave.startsAt >= "2026-10-07" &&
        leave.endsAt < DAY,
    );

    expect(new Set(covering.map((leave) => leave.kind)).size).toBe(3);
  });

  it("spreads the requests over the sample residents, and never lets two of one resident overlap", () => {
    for (const leave of leaves) {
      expect(leave.resident).toBeLessThan(SAMPLE_LEAVE_RESIDENTS);
      expect(leave.endsAt > leave.startsAt).toBe(true);
    }
    for (const [place, one] of leaves.entries()) {
      for (const other of leaves.slice(place + 1)) {
        if (one.resident !== other.resident) continue;
        const overlaps =
          one.startsAt < other.endsAt && other.startsAt < one.endsAt;
        expect(overlaps).toBe(false);
      }
    }
  });

  it("gives a note to every rejected request, and none to one that waits", () => {
    for (const leave of leaves) {
      if (leave.status === "rejected") expect(leave.decisionNote).not.toBe("");
      if (leave.status === "submitted") expect(leave.decisionNote).toBe("");
    }
  });

  it("has reports of a return in every state, of Izin pesiar or Izin khusus only", () => {
    const states = new Set(reported.map(({ report }) => report.status));

    expect([...states].sort()).toEqual([...REPORT_STATUSES].sort());
    for (const { leave } of reported) {
      expect(leave.kind).not.toBe("skip_activities");
    }
  });

  it("sends each report once it opens, before now, and gives a note to a rejected one", () => {
    const opensMs = REPORT_OPENS_MINUTES * 60_000;
    for (const { leave, report } of reported) {
      const opens = Date.parse(`${leave.endsAt}:00+07:00`) - opensMs;
      const sent = Date.parse(`${report.sentAt}:00+07:00`);
      expect(sent).toBeGreaterThanOrEqual(opens);
      expect(sent).toBeLessThanOrEqual(NOW.getTime());
      if (report.status === "rejected") expect(report.verifyNote).not.toBe("");
    }
  });

  it("makes leave Selesai with its return, and validated reports only of such leave", () => {
    for (const leave of leaves) {
      expect(leave.status === "completed").toBe(leave.returnedAt !== null);
      if (leave.recordedDirectly) expect(leave.report).toBeNull();
    }
    for (const { leave, report } of reported) {
      const isValidated = report.status === "validated";
      expect(leave.status === "completed").toBe(isValidated);
      if (isValidated) expect(leave.returnedAt).toBe(report.sentAt);
    }
  });

  it("keeps Izin pesiar within one day and under 12 hours", () => {
    for (const leave of leaves.filter((each) => each.kind === "outing")) {
      expect(leave.startsAt.slice(0, 10)).toBe(leave.endsAt.slice(0, 10));
      const hours =
        (Date.parse(`${leave.endsAt}:00Z`) -
          Date.parse(`${leave.startsAt}:00Z`)) /
        3_600_000;
      expect(hours).toBeLessThan(12);
    }
  });
});
