import { describe, expect, it } from "vitest";
import { parseCoachingChange } from "./coaching-change";
import {
  COACHING_NOTE_TOO_LONG,
  NOT_A_COACHING_STATUS,
  statusChangedMessage,
} from "./coaching-messages";

describe("parseCoachingChange", () => {
  it("takes each of the four statuses, with the note trimmed", () => {
    for (const status of [
      "identified",
      "counselling",
      "monitoring",
      "done",
    ] as const) {
      expect(parseCoachingChange(status, "  Diajak bicara.  ")).toEqual({
        ok: true,
        value: { status, note: "Diajak bicara." },
      });
    }
  });

  it("takes no note at all", () => {
    expect(parseCoachingChange("done", "   ")).toEqual({
      ok: true,
      value: { status: "done", note: "" },
    });
  });

  it("refuses a status not on the list", () => {
    expect(parseCoachingChange("Selesai", "")).toEqual(NOT_A_COACHING_STATUS);
    expect(parseCoachingChange("", "")).toEqual(NOT_A_COACHING_STATUS);
  });

  it("takes a note of 300 characters and refuses a longer one", () => {
    expect(parseCoachingChange("done", "a".repeat(300)).ok).toBe(true);
    expect(parseCoachingChange("done", "a".repeat(301))).toEqual(
      COACHING_NOTE_TOO_LONG,
    );
  });
});

describe("statusChangedMessage", () => {
  it("says whose status it is and what it is now", () => {
    expect(statusChangedMessage("Gita Purba", "counselling")).toBe(
      "Status Gita Purba: Konseling.",
    );
  });
});
