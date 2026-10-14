import { describe, expect, it } from "vitest";
import { loggedMarks } from "./count-marks";

describe("loggedMarks", () => {
  it("keeps the absent ones and the ones with a note, and leaves out the rest", () => {
    const marks = {
      absent: { isAbsent: true, note: "" },
      noted: { isAbsent: false, note: "Terlambat" },
      present: { isAbsent: false, note: "" },
      both: { isAbsent: true, note: "Sakit" },
    };

    expect(loggedMarks(marks)).toEqual({
      absent: marks.absent,
      noted: marks.noted,
      both: marks.both,
    });
  });

  it("is empty when everyone was present without a note", () => {
    expect(loggedMarks({ a: { isAbsent: false, note: "" } })).toEqual({});
  });
});
