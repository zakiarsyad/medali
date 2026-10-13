import { describe, expect, it } from "vitest";
import {
  type AttendanceValues,
  allMarked,
  hasUnsavedChanges,
  marksOf,
  marksToCorrect,
} from "./attendance-form-values";

const KEPT: AttendanceValues = {
  heldOn: "2026-10-13",
  topic: "Orientasi kelompok dan kontrak belajar",
  marks: { a: "present", b: "present" },
};

describe("allMarked", () => {
  it("gives every member the same mark, as Tandai semua hadir does", () => {
    expect(allMarked(["a", "b"], "present")).toEqual({
      a: "present",
      b: "present",
    });
    expect(allMarked([], "present")).toEqual({});
  });
});

describe("marksOf", () => {
  it("lists the marks of the members, for the running count", () => {
    const marks = { a: "sick", b: "present", left: "absent" } as const;

    expect(marksOf(marks, ["b", "a"])).toEqual(["present", "sick"]);
  });
});

describe("marksToCorrect", () => {
  it("opens a saved list with the mark kept for each member of today", () => {
    const kept = { a: "sick", b: "present" } as const;

    expect(marksToCorrect(["a", "b"], kept)).toEqual(kept);
  });

  it("starts a member who joined after the list was saved as Alpa", () => {
    expect(marksToCorrect(["a", "new"], { a: "present" })).toEqual({
      a: "present",
      new: "absent",
    });
  });

  it("does not show the mark kept for a student who is no member today", () => {
    const kept = { a: "present", left: "excused" } as const;

    expect(marksToCorrect(["a"], kept)).toEqual({ a: "present" });
  });
});

describe("hasUnsavedChanges", () => {
  it("finds none in a form that holds what it was opened with", () => {
    const now = { ...KEPT, marks: { b: "present", a: "present" } as const };

    expect(hasUnsavedChanges(KEPT, now)).toBe(false);
  });

  it("finds a changed day, a changed topic and a changed mark", () => {
    const otherMark = { ...KEPT.marks, b: "absent" } as const;

    expect(hasUnsavedChanges(KEPT, { ...KEPT, heldOn: "2026-10-12" })).toBe(
      true,
    );
    expect(hasUnsavedChanges(KEPT, { ...KEPT, topic: "Topik lain" })).toBe(
      true,
    );
    expect(hasUnsavedChanges(KEPT, { ...KEPT, marks: otherMark })).toBe(true);
  });

  it("finds none once a mark is put back as it was", () => {
    const back = { ...KEPT, marks: { ...KEPT.marks } };

    expect(hasUnsavedChanges(KEPT, back)).toBe(false);
  });
});
