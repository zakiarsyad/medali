import { describe, expect, it } from "vitest";
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
  });
});
