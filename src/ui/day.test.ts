import { describe, expect, it } from "vitest";
import { shownDay } from "./day";

describe("shownDay", () => {
  it("shows a stored day the way the screens write a day", () => {
    expect(shownDay("2026-08-01")).toBe("1 Agu 2026");
    expect(shownDay("2027-01-31")).toBe("31 Jan 2027");
  });
});
