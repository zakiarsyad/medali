import { describe, expect, it } from "vitest";
import { leaveScreensOf } from "./leave-screens";

describe("leaveScreensOf", () => {
  it("gives a resident who is also BAM - BPHK their own part and the staff screen", () => {
    expect(leaveScreensOf(["student", "bam_bphk"])).toEqual({
      staff: true,
      own: true,
    });
  });

  it("gives a resident only their own part, and staff only the staff screen", () => {
    expect(leaveScreensOf(["student"])).toEqual({ staff: false, own: true });
    expect(leaveScreensOf(["bam_bphk"])).toEqual({ staff: true, own: false });
    expect(leaveScreensOf(["dorm_manager"])).toEqual({
      staff: true,
      own: false,
    });
  });
});
