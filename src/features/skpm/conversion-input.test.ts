import { describe, expect, it } from "vitest";
import { INVALID_POINTS, parsePointsForHundred } from "./conversion-input";

describe("parsePointsForHundred", () => {
  it.each([
    ["1", 1],
    ["50", 50],
    [" 40 ", 40],
    ["1000", 1000],
  ])("takes the whole number %s", (sent, points) => {
    expect(parsePointsForHundred(sent)).toEqual({ ok: true, value: points });
  });

  it.each(["", "0", "1001", "-5", "12.5", "12,5", "abc", "1e2", "00050"])(
    "refuses %j with the prototype's message",
    (sent) => {
      expect(parsePointsForHundred(sent)).toEqual(INVALID_POINTS);
    },
  );

  it("says what to do", () => {
    expect(INVALID_POINTS.error).toBe("Isi jumlah poin yang valid.");
  });
});
