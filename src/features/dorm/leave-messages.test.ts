import { describe, expect, it } from "vitest";
import {
  keptDecision,
  REJECTION_NEEDS_NOTE,
  refusedDecision,
  tooLateToDecide,
} from "./leave-messages";
import { reportDecidedFirst, STILL_WAITS_FOR_BAM } from "./return-messages";

describe("what a decision answers the screen", () => {
  it("marks a refusal because the request or report was decided or cancelled first", () => {
    expect(refusedDecision(tooLateToDecide("cancelled"))).toEqual({
      error: tooLateToDecide("cancelled").error,
      done: null,
      stale: true,
    });
    expect(refusedDecision(reportDecidedFirst("rejected")).stale).toBe(true);
  });

  it("does not mark a refusal the person can mend on the same card", () => {
    expect(refusedDecision(REJECTION_NEEDS_NOTE)).toEqual({
      error: REJECTION_NEEDS_NOTE.error,
      done: null,
      stale: false,
    });
    expect(refusedDecision(STILL_WAITS_FOR_BAM).stale).toBe(false);
  });

  it("says what a kept decision made it", () => {
    expect(keptDecision("Izin disetujui.")).toEqual({
      error: null,
      done: "Izin disetujui.",
      stale: false,
    });
  });
});
