import { describe, expect, it } from "vitest";
import { cleaningScreensOf } from "./cleaning-screens";

describe("cleaningScreensOf", () => {
  it("gives a resident who is also a BAM member their own part and the staff screen", () => {
    for (const bam of ["bam_household", "bam_bphk"] as const) {
      expect(cleaningScreensOf(["student", bam])).toEqual({
        staff: true,
        own: true,
      });
    }
  });

  it("gives a resident only their own part, and staff only the staff screen", () => {
    expect(cleaningScreensOf(["student"])).toEqual({
      staff: false,
      own: true,
    });
    expect(cleaningScreensOf(["bam_household"])).toEqual({
      staff: true,
      own: false,
    });
    expect(cleaningScreensOf(["dorm_manager"])).toEqual({
      staff: true,
      own: false,
    });
  });
});
