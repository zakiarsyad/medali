import { describe, expect, it } from "vitest";
import { attendanceRate, rateWords } from "./attendance-rate";

describe("attendanceRate", () => {
  it("is the share of those present, as a whole percentage", () => {
    expect(attendanceRate(9, 10)).toBe(90);
    expect(attendanceRate(2, 3)).toBe(67);
    expect(attendanceRate(1, 3)).toBe(33);
    expect(attendanceRate(10, 10)).toBe(100);
    expect(attendanceRate(0, 4)).toBe(0);
  });

  it("is null when there is no one to count", () => {
    expect(attendanceRate(0, 0)).toBeNull();
  });
});

describe("rateWords", () => {
  it("writes the percentage, or a dash when there is none", () => {
    expect(rateWords(67)).toBe("67%");
    expect(rateWords(null)).toBe("-");
  });
});
