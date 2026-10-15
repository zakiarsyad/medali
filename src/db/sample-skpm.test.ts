import { describe, expect, it } from "vitest";
import { ROW_POINTS_MAX, ROW_POINTS_MIN } from "@/features/skpm/skpm-ids";
import { SAMPLE_STUDENTS } from "./sample-data";
import { SAMPLE_SKPM_UPLOADS } from "./sample-skpm";

const ACTIVE_NIMS = new Set(
  SAMPLE_STUDENTS.filter(
    (student) => (student.status ?? "active") === "active",
  ).map((student) => student.nim),
);

describe("the sample SKPM uploads", () => {
  it.each(SAMPLE_SKPM_UPLOADS)(
    "name only Aktif sample students, with points the rules allow: $fileName",
    (upload) => {
      expect(upload.rows.length).toBeGreaterThan(0);
      for (const row of upload.rows) {
        expect(ACTIVE_NIMS.has(row.nim)).toBe(true);
        expect(row.points).toBeGreaterThanOrEqual(ROW_POINTS_MIN);
        expect(row.points).toBeLessThanOrEqual(ROW_POINTS_MAX);
      }
    },
  );

  it("are oldest first, and removed only after they were saved", () => {
    const days = SAMPLE_SKPM_UPLOADS.map((upload) => upload.daysAgo);
    expect(days).toEqual([...days].sort((one, other) => other - one));
    for (const upload of SAMPLE_SKPM_UPLOADS) {
      if (upload.removedDaysAgo === null) continue;
      expect(upload.removedDaysAgo).toBeLessThanOrEqual(upload.daysAgo);
    }
  });

  it("hold one replaced upload, one that replaces, and one removed", () => {
    const replacing = SAMPLE_SKPM_UPLOADS.findIndex(
      (upload) => upload.mode === "replace",
    );
    const removed = SAMPLE_SKPM_UPLOADS.filter(
      (upload) => upload.removedDaysAgo !== null,
    );

    expect(replacing).toBeGreaterThan(0);
    expect(removed).toHaveLength(1);
  });
});
