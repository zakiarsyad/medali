import { describe, expect, it } from "vitest";
import { countProofs, type SentGroup } from "./proof-counts";
import { noCounts } from "./proof-kinds";
import type { KeepingRule } from "./removable";

const RULE: KeepingRule = {
  keepDays: 30,
  periods: [{ startsOn: "2025-08-01", endsOn: "2026-01-31" }],
  today: "2026-06-01",
};

function group(more: Partial<SentGroup>): SentGroup {
  return {
    kind: "attendance_photo",
    status: "valid",
    sentOn: "2025-10-01",
    isMarked: false,
    files: 1,
    ...more,
  };
}

describe("countProofs", () => {
  it("counts every kept file, and those that may go now", () => {
    const counts = countProofs(
      [
        group({ files: 4 }),
        group({ status: "waiting", files: 2 }),
        group({ kind: "appeal_proof", status: "rejected", files: 3 }),
      ],
      RULE,
    );

    expect(counts.kept).toEqual({
      ...noCounts(),
      attendance_photo: 6,
      appeal_proof: 3,
    });
    expect(counts.removable).toEqual({
      ...noCounts(),
      attendance_photo: 4,
      appeal_proof: 3,
    });
  });

  it("takes a marked file as no longer kept, and as one to finish", () => {
    const counts = countProofs(
      [group({ isMarked: true, files: 2 }), group({ files: 1 })],
      RULE,
    );

    expect(counts.kept.attendance_photo).toBe(1);
    expect(counts.removable.attendance_photo).toBe(3);
  });

  it("lets nothing go while the number of days is not set", () => {
    const counts = countProofs([group({ files: 5 })], {
      ...RULE,
      keepDays: null,
    });

    expect(counts.kept.attendance_photo).toBe(5);
    expect(counts.removable).toEqual(noCounts());
  });

  it("counts nothing with no files", () => {
    expect(countProofs([], RULE)).toEqual({
      kept: noCounts(),
      removable: noCounts(),
    });
  });
});
