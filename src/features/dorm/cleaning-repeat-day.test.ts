import { describe, expect, it } from "vitest";
import { repeatDay } from "./cleaning-repeat-day";

describe("repeatDay", () => {
  it("is the day after the validation when that day is free", () => {
    expect(repeatDay("2026-10-15", [])).toBe("2026-10-16");
    expect(repeatDay("2026-10-15", ["2026-10-15", "2026-10-18"])).toBe(
      "2026-10-16",
    );
  });

  it("goes to the next free day when the next day already has a duty", () => {
    expect(repeatDay("2026-10-15", ["2026-10-16"])).toBe("2026-10-17");
    expect(
      repeatDay("2026-10-15", ["2026-10-18", "2026-10-16", "2026-10-17"]),
    ).toBe("2026-10-19");
  });

  it("passes the end of a month", () => {
    expect(repeatDay("2026-10-30", ["2026-10-31"])).toBe("2026-11-01");
  });
});
