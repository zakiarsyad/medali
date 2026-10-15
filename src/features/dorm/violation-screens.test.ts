import { describe, expect, it } from "vitest";
import { violationScreensOf } from "./violation-screens";

describe("violationScreensOf", () => {
  it("gives a resident who is also a BAM member the staff screen and their own record", () => {
    for (const bam of ["bam_bphk", "bam_compliance", "bam_health"] as const) {
      expect(violationScreensOf(["student", bam])).toEqual({
        staff: true,
        own: true,
      });
    }
  });

  it("gives a resident only their own record, and staff only the staff screen", () => {
    expect(violationScreensOf(["student"])).toEqual({
      staff: false,
      own: true,
    });
    expect(violationScreensOf(["bam_bphk"])).toEqual({
      staff: true,
      own: false,
    });
    expect(violationScreensOf(["dorm_manager"])).toEqual({
      staff: true,
      own: false,
    });
  });
});
