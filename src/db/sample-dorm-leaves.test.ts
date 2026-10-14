import { describe, expect, it } from "vitest";
import { LEAVE_KINDS, LEAVE_STATUSES } from "@/features/dorm/leave-ids";
import { SAMPLE_LEAVE_RESIDENTS, sampleDormLeaves } from "./sample-dorm-leaves";

const DAY = "2026-10-14";
const leaves = sampleDormLeaves(DAY);

describe("sampleDormLeaves", () => {
  it("has requests of every kind and in every status", () => {
    const kinds = new Set(leaves.map((leave) => leave.kind));
    const statuses = new Set(leaves.map((leave) => leave.status));

    expect([...kinds].sort()).toEqual([...LEAVE_KINDS].sort());
    expect([...statuses].sort()).toEqual([...LEAVE_STATUSES].sort());
  });

  it("has approved requests in the week before the day, of each kind", () => {
    const covering = leaves.filter(
      (leave) =>
        leave.status === "approved" &&
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
