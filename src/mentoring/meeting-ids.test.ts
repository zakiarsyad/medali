import { describe, expect, it } from "vitest";
import { isMeetingNumber } from "./meeting-ids";

describe("isMeetingNumber", () => {
  it.each([1, 2, 3, 4])("takes %i", (number) => {
    expect(isMeetingNumber(number)).toBe(true);
  });

  it.each([0, 5, -1, 1.5, Number.NaN])(
    "refuses %d, which no meeting of a period has",
    (number) => {
      expect(isMeetingNumber(number)).toBe(false);
    },
  );
});
