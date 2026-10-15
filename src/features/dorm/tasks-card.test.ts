import { describe, expect, it } from "vitest";
import { DECIDED_FIRST as CLARIFICATION_DECIDED_FIRST } from "./clarification-decision";
import {
  DECIDED_FIRST as ASSESSMENT_DECIDED_FIRST,
  NOT_JUDGED_YET,
  SEND_BACK_REASON_NEEDED,
} from "./cleaning-messages";
import {
  keptDecision,
  REJECTION_NEEDS_NOTE,
  refusedDecision,
  tooLateToDecide,
} from "./leave-messages";
import { ALREADY_SETTLED, taskOutcome } from "./tasks-card";

describe("taskOutcome", () => {
  it("says Sudah diproses above the section and reads the page again for an item decided elsewhere first", () => {
    expect(taskOutcome(refusedDecision(tooLateToDecide("approved")))).toEqual({
      onCard: null,
      onSection: { error: ALREADY_SETTLED, done: null },
      reload: true,
    });
  });

  it.each([
    ["a clarification", CLARIFICATION_DECIDED_FIRST],
    ["a cleaning assessment validated", ASSESSMENT_DECIDED_FIRST],
    ["a cleaning assessment sent back", NOT_JUDGED_YET],
  ])("does the same for %s first", (_what, refusal) => {
    expect(taskOutcome(refusedDecision(refusal))).toEqual({
      onCard: null,
      onSection: { error: ALREADY_SETTLED, done: null },
      reload: true,
    });
  });

  it("says a kept decision above the section, without reading the page again", () => {
    expect(taskOutcome(keptDecision("Izin disetujui."))).toEqual({
      onCard: null,
      onSection: { error: null, done: "Izin disetujui." },
      reload: false,
    });
  });

  it("keeps any other refusal on its card", () => {
    expect(taskOutcome(refusedDecision(REJECTION_NEEDS_NOTE))).toEqual({
      onCard: REJECTION_NEEDS_NOTE.error,
      onSection: null,
      reload: false,
    });
    expect(taskOutcome(refusedDecision(SEND_BACK_REASON_NEEDED)).onCard).toBe(
      SEND_BACK_REASON_NEEDED.error,
    );
  });
});
