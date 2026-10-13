import { describe, expect, it } from "vitest";
import { REPLACEMENT_REASONS } from "@/mentoring/replacement-ids";
import { oldMentorStatusFor } from "./old-mentor-status";

describe("oldMentorStatusFor", () => {
  it.each(["transfer", "retirement", "study_leave"] as const)(
    "is Tidak aktif for %s, a mentor who leaves the campus",
    (reason) => {
      expect(oldMentorStatusFor(reason)).toBe("inactive");
    },
  );

  it.each(["poor_evaluation", "own_request", "other"] as const)(
    "is Cadangan for %s, a mentor who stays",
    (reason) => {
      expect(oldMentorStatusFor(reason)).toBe("reserve");
    },
  );

  it("is Tidak aktif for three of the reasons and no more", () => {
    const inactive = REPLACEMENT_REASONS.filter(
      (reason) => oldMentorStatusFor(reason) === "inactive",
    );

    expect(inactive).toHaveLength(3);
  });
});
