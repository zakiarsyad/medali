import { describe, expect, it } from "vitest";
import { isOutsideDates } from "./outside-dates";

const TWO_DAYS = { startsOn: "2026-10-13", endsOn: "2026-10-14" };

describe("isOutsideDates", () => {
  it.each([
    ["the first minute of the first day on campus", "2026-10-12T17:00:00Z"],
    ["the middle of the first day", "2026-10-13T03:00:00Z"],
    ["the last minute of the last day on campus", "2026-10-14T16:59:00Z"],
  ])("is not so for a photo sent at %s", (_when, sentAt) => {
    expect(isOutsideDates(new Date(sentAt), TWO_DAYS)).toBe(false);
  });

  it.each([
    ["the last minute before the first day on campus", "2026-10-12T16:59:00Z"],
    ["the first minute after the last day on campus", "2026-10-14T17:00:00Z"],
    ["a week later, while the upload is still open", "2026-10-21T03:00:00Z"],
  ])("is so for a photo sent at %s", (_when, sentAt) => {
    expect(isOutsideDates(new Date(sentAt), TWO_DAYS)).toBe(true);
  });
});
