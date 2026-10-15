import { describe, expect, it } from "vitest";
import { activitiesScreensOf } from "./activities-screens";

describe("activitiesScreensOf", () => {
  it("gives a resident who is also a BAM member their own part and the staff screen", () => {
    for (const bam of ["bam_bphk", "bam_household", "bam_health"] as const) {
      expect(activitiesScreensOf(["student", bam])).toEqual({
        staff: true,
        own: true,
      });
    }
  });

  it("gives a resident only their own part, and staff only the staff screen", () => {
    expect(activitiesScreensOf(["student"])).toEqual({
      staff: false,
      own: true,
    });
    expect(activitiesScreensOf(["bam_bphk"])).toEqual({
      staff: true,
      own: false,
    });
    expect(activitiesScreensOf(["dorm_manager"])).toEqual({
      staff: true,
      own: false,
    });
  });
});
