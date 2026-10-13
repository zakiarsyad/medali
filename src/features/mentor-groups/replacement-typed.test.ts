import { describe, expect, it } from "vitest";
import {
  startOfReplacement,
  withOldStatus,
  withReason,
} from "./replacement-typed";

const TODAY = "2026-10-13";

describe("startOfReplacement", () => {
  it("starts with the first reason, today, Cadangan, and nothing chosen or ticked", () => {
    expect(startOfReplacement(TODAY)).toEqual({
      reason: "poor_evaluation",
      startsOn: TODAY,
      newMentorId: "",
      letterNumber: "",
      oldStatus: { status: "reserve", wasChosen: false },
      note: "",
      isConfirmed: false,
    });
  });
});

describe("withReason", () => {
  it("sets Tidak aktif for Mutasi, Pensiun and Tugas belajar", () => {
    const start = startOfReplacement(TODAY);

    for (const reason of ["transfer", "retirement", "study_leave"]) {
      expect(withReason(start, reason)).toMatchObject({
        reason,
        oldStatus: { status: "inactive", wasChosen: false },
      });
    }
  });

  it("goes back to Cadangan for a reason after which the mentor stays", () => {
    const retired = withReason(startOfReplacement(TODAY), "retirement");

    expect(withReason(retired, "own_request").oldStatus).toEqual({
      status: "reserve",
      wasChosen: false,
    });
  });

  it("keeps the status the person chose for a reason after which the mentor stays", () => {
    const chosen = withOldStatus(startOfReplacement(TODAY), "inactive");

    expect(withReason(chosen, "other").oldStatus).toEqual({
      status: "inactive",
      wasChosen: true,
    });
  });

  it("changes nothing for what names no reason", () => {
    const start = startOfReplacement(TODAY);

    expect(withReason(start, "Bosan")).toBe(start);
  });
});

describe("withOldStatus", () => {
  it("keeps what the person chose, and that they chose it", () => {
    const chosen = withOldStatus(startOfReplacement(TODAY), "inactive");

    expect(chosen.oldStatus).toEqual({ status: "inactive", wasChosen: true });
  });

  it("changes nothing for what names no status", () => {
    const start = startOfReplacement(TODAY);

    expect(withOldStatus(start, "mentoring")).toBe(start);
  });
});
