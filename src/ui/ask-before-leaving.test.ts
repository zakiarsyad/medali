import { describe, expect, it } from "vitest";
import { type LinkPress, leavesPage } from "./ask-before-leaving";

const PLAIN: LinkPress = { button: 0, withKey: false, target: "" };

describe("leavesPage", () => {
  it("is asked about for a plain press on a link of the app", () => {
    expect(leavesPage(PLAIN)).toBe(true);
    expect(leavesPage({ ...PLAIN, target: "_self" })).toBe(true);
  });

  it("is not asked about for a link opened in a new tab or window", () => {
    expect(leavesPage({ ...PLAIN, withKey: true })).toBe(false);
    expect(leavesPage({ ...PLAIN, button: 1 })).toBe(false);
    expect(leavesPage({ ...PLAIN, target: "_blank" })).toBe(false);
  });
});
