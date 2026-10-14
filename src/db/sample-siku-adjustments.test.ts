import { describe, expect, it } from "vitest";
import {
  POINTS_MAX,
  POINTS_MIN,
  REASON_WITH_BASIS,
  reasonsOf,
} from "@/features/siku/siku-ids";
import { SAMPLE_STUDENTS } from "./sample-data";
import { SAMPLE_SIKU_ENTRIES } from "./sample-siku-adjustments";

const ACTIVE_NIMS = new Set(
  SAMPLE_STUDENTS.filter(
    (student) => (student.status ?? "active") === "active",
  ).map((student) => student.nim),
);

describe("the sample SIKU entries", () => {
  it.each(SAMPLE_SIKU_ENTRIES)(
    "name only Aktif sample students, each once: $note",
    (entry) => {
      expect(entry.nims.length).toBeGreaterThan(0);
      expect(new Set(entry.nims).size).toBe(entry.nims.length);
      for (const nim of entry.nims) expect(ACTIVE_NIMS.has(nim)).toBe(true);
    },
  );

  it.each(SAMPLE_SIKU_ENTRIES)(
    "hold points, a reason and a basis the rules allow: $note",
    (entry) => {
      expect(entry.points).toBeGreaterThanOrEqual(POINTS_MIN);
      expect(entry.points).toBeLessThanOrEqual(POINTS_MAX);
      expect(reasonsOf(entry.kind)).toContain(entry.reason);
      expect(entry.basis !== "").toBe(entry.reason === REASON_WITH_BASIS);
    },
  );

  it("are cancelled only after they were entered", () => {
    for (const entry of SAMPLE_SIKU_ENTRIES) {
      if (entry.cancelledDaysAgo === null) continue;
      expect(entry.cancelledDaysAgo).toBeLessThanOrEqual(entry.daysAgo);
    }
  });

  it("have gains and losses, one cancelled and one from a semester before", () => {
    const kinds = new Set(SAMPLE_SIKU_ENTRIES.map((entry) => entry.kind));
    const cancelled = SAMPLE_SIKU_ENTRIES.filter(
      (entry) => entry.cancelledDaysAgo !== null,
    );
    const oldest = Math.max(...SAMPLE_SIKU_ENTRIES.map((e) => e.daysAgo));

    expect([...kinds].sort()).toEqual(["gain", "loss"]);
    expect(cancelled).toHaveLength(1);
    expect(oldest).toBeGreaterThan(184);
  });
});
