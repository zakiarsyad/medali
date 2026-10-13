import { describe, expect, it } from "vitest";
import { REPLACEMENT_REASONS } from "@/mentoring/replacement-ids";
import { oldMentorStatusFor, statusAfterReason } from "./old-mentor-status";

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

describe("statusAfterReason", () => {
  it("sets Tidak aktif for a reason after which the mentor leaves, whatever was chosen", () => {
    const chosen = { status: "reserve", wasChosen: true } as const;

    expect(statusAfterReason("retirement", chosen)).toBe("inactive");
  });

  it("keeps what the person chose for a reason after which the mentor stays", () => {
    const chosen = { status: "inactive", wasChosen: true } as const;

    expect(statusAfterReason("own_request", chosen)).toBe("inactive");
  });

  it("goes back to Cadangan when the person chose nothing themselves", () => {
    const set = { status: "inactive", wasChosen: false } as const;

    expect(statusAfterReason("other", set)).toBe("reserve");
  });
});
