import { describe, expect, it } from "vitest";
import {
  causesOf,
  letterMark,
  neededLevel,
  progressOf,
  type WarningStanding,
} from "./warning-rule";

function standing(more: Partial<WarningStanding> = {}): WarningStanding {
  return {
    counted: 0,
    rejected: 0,
    hasFirst: false,
    hasSecond: false,
    ...more,
  };
}

describe("neededLevel", () => {
  it("calls for nothing under 7 counted violations and with no rejected clarification", () => {
    expect(neededLevel(standing())).toBeNull();
    expect(neededLevel(standing({ counted: 6 }))).toBeNull();
  });

  it("calls for SP 1 at 7 counted violations or one rejected clarification", () => {
    expect(neededLevel(standing({ counted: 7 }))).toBe(1);
    expect(neededLevel(standing({ rejected: 1 }))).toBe(1);
    expect(neededLevel(standing({ counted: 15, rejected: 3 }))).toBe(1);
  });

  it("after SP 1, calls for SP 2 at 12 counted violations in all or a second rejected clarification", () => {
    const afterFirst = { hasFirst: true };
    expect(neededLevel(standing({ ...afterFirst, counted: 11 }))).toBeNull();
    expect(neededLevel(standing({ ...afterFirst, rejected: 1 }))).toBeNull();
    expect(neededLevel(standing({ ...afterFirst, counted: 12 }))).toBe(2);
    expect(neededLevel(standing({ ...afterFirst, rejected: 2 }))).toBe(2);
  });

  it("calls for nothing more once SP 2 is issued", () => {
    expect(
      neededLevel(
        standing({ hasFirst: true, hasSecond: true, counted: 30, rejected: 5 }),
      ),
    ).toBeNull();
  });
});

describe("causesOf", () => {
  it("names the violations and the rejected clarification behind SP 1", () => {
    expect(causesOf(standing({ counted: 7 }), 1)).toEqual([
      "7 pelanggaran tercatat",
    ]);
    expect(causesOf(standing({ counted: 3, rejected: 1 }), 1)).toEqual([
      "klarifikasi kehadiran ditolak",
    ]);
    expect(causesOf(standing({ counted: 8, rejected: 2 }), 1)).toEqual([
      "8 pelanggaran tercatat",
      "klarifikasi kehadiran ditolak",
    ]);
  });

  it("names what came again behind SP 2, with how many times a clarification was rejected", () => {
    const afterFirst = { hasFirst: true };
    expect(causesOf(standing({ ...afterFirst, counted: 12 }), 2)).toEqual([
      "12 pelanggaran tercatat",
    ]);
    expect(
      causesOf(standing({ ...afterFirst, counted: 9, rejected: 2 }), 2),
    ).toEqual(["klarifikasi kehadiran ditolak lagi (2 kali)"]);
  });
});

describe("progressOf", () => {
  it("counts toward the call for SP 1 out of 7, with how many are left", () => {
    expect(progressOf(standing({ counted: 3 }))).toEqual({
      label: "Menuju panggilan SP 1",
      amount: "3/7",
      note: "4 pelanggaran lagi",
    });
    expect(progressOf(standing({ counted: 9 }))).toEqual({
      label: "Menuju panggilan SP 1",
      amount: "7/7",
      note: "panggilan aktif",
    });
  });

  it("after SP 1, counts toward SP 2 out of 12 in all, and says when SP 2 is issued", () => {
    expect(progressOf(standing({ hasFirst: true, counted: 8 }))).toEqual({
      label: "Menuju SP 2",
      amount: "8/12",
      note: "4 pelanggaran lagi",
    });
    expect(progressOf(standing({ hasFirst: true, counted: 12 }))).toEqual({
      label: "Menuju SP 2",
      amount: "12/12",
      note: "panggilan aktif",
    });
    expect(
      progressOf(standing({ hasFirst: true, hasSecond: true, counted: 13 })),
    ).toEqual({
      label: "Menuju SP 2",
      amount: "12/12",
      note: "SP 2 sudah terbit",
    });
  });
});

describe("letterMark", () => {
  it("is the highest SP issued, or none", () => {
    expect(letterMark(standing())).toBeNull();
    expect(letterMark(standing({ hasFirst: true }))).toBe(1);
    expect(letterMark(standing({ hasFirst: true, hasSecond: true }))).toBe(2);
  });
});
