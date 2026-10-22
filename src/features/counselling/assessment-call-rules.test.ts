import { describe, expect, it } from "vitest";
import { SCHEDULE_STATUSES } from "@/mental-health/schedule-ids";
import { callReason, showsCallTime } from "./assessment-call-rules";

describe("the reason of a call from Asesmen karakter", () => {
  it("names the Rerata, the level and the weakest value", () => {
    expect(
      callReason(
        { M: 55, E: 58, D: 60, A: 57, L: 59, I: 61 },
        { level: "intensive", weakest: "M" },
      ),
    ).toBe(
      "Asesmen karakter: rerata 58,3, pembinaan intensif, aspek terlemah Mandiri",
    );
  });

  it("writes a whole Rerata with its decimal", () => {
    expect(
      callReason(
        { M: 70, E: 72, D: 56, A: 75, L: 74, I: 73 },
        { level: "light", weakest: "D" },
      ),
    ).toBe(
      "Asesmen karakter: rerata 70,0, pembinaan ringan, aspek terlemah Disiplin",
    );
  });
});

describe("the date and Jam of a call", () => {
  it("shows them once Konselor set the time, and after it", () => {
    const shown = SCHEDULE_STATUSES.filter(showsCallTime);

    expect(shown).toEqual(["scheduled", "done", "missed"]);
  });
});
