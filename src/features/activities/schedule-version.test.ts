import { describe, expect, it } from "vitest";
import { momentOf, versionOf } from "./schedule-version";

describe("versionOf and momentOf", () => {
  it("give back the moment a version was made from", () => {
    const changedAt = new Date("2026-10-13T02:03:04.567Z");

    expect(momentOf(versionOf(changedAt))).toEqual(changedAt);
  });

  it("tell two changes one millisecond apart from each other", () => {
    const sooner = versionOf(new Date("2026-10-13T02:03:04.567Z"));
    const later = versionOf(new Date("2026-10-13T02:03:04.568Z"));

    expect(sooner).not.toBe(later);
  });
});

describe("momentOf", () => {
  it.each(["", "kemarin", "2026-10-13", "1", "2026-10-13T02:03:04Z"])(
    "takes %j as no version this app made",
    (version) => {
      expect(momentOf(version)).toBeNull();
    },
  );
});
