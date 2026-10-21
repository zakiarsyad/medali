import { describe, expect, it } from "vitest";
import { nextChangedAt, STARTING_VERSION, savedVersion } from "./saved-version";

describe("savedVersion", () => {
  it("gives the starting version while nothing is saved", () => {
    expect(savedVersion(null)).toBe(STARTING_VERSION);
  });

  it("gives the moment of the last save to the millisecond", () => {
    expect(savedVersion(new Date("2026-10-21T03:00:00.123Z"))).toBe(
      "2026-10-21T03:00:00.123Z",
    );
  });
});

describe("nextChangedAt", () => {
  it("gives now while nothing is saved", () => {
    const before = Date.now();

    expect(nextChangedAt(null).getTime()).toBeGreaterThanOrEqual(before);
  });

  it("gives now after a save made earlier", () => {
    const earlier = new Date(Date.now() - 1000);

    expect(nextChangedAt(earlier).getTime()).toBeGreaterThan(earlier.getTime());
  });

  it("gives one millisecond after a save made in the same millisecond or later", () => {
    const later = new Date(Date.now() + 60_000);

    expect(nextChangedAt(later).getTime()).toBe(later.getTime() + 1);
  });
});
