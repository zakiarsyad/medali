import { describe, expect, it } from "vitest";
import { isToldAbove } from "./answer-place";
import { ASK_FOR_NUMBER } from "./decree-input";
import { ALREADY_FIXED, DRAFT_CHANGED, NOT_FIXED } from "./refusals";

function refused(error: string) {
  return { error, done: null };
}

function done(words: string) {
  return { error: null, done: words };
}

describe("isToldAbove", () => {
  it.each(["save", "submit", "fix"] as const)(
    "tells above the angkatan that it was fixed meanwhile, for %s",
    (step) => {
      expect(isToldAbove(step, refused(ALREADY_FIXED.error))).toBe(true);
    },
  );

  it("tells above the angkatan that a cancel found it cancelled meanwhile", () => {
    expect(isToldAbove("cancel", refused(NOT_FIXED.error))).toBe(true);
  });

  it("keeps under the button a refusal that leaves the form on the page", () => {
    expect(isToldAbove("fix", refused(DRAFT_CHANGED.error))).toBe(false);
    expect(isToldAbove("fix", refused(ASK_FOR_NUMBER))).toBe(false);
  });

  it("keeps under the button what a saved draft says", () => {
    expect(isToldAbove("save", done("Draf disimpan."))).toBe(false);
  });

  it.each(["fix", "cancel"] as const)(
    "tells above the angkatan what a %s that took effect did",
    (step) => {
      expect(isToldAbove(step, done("Selesai."))).toBe(true);
    },
  );
});
