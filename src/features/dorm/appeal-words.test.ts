import { describe, expect, it } from "vitest";
import { shortReason } from "./appeal-words";

describe("shortReason", () => {
  it("shows a reason of up to 80 letters whole", () => {
    expect(shortReason("a".repeat(80))).toBe("a".repeat(80));
  });

  it("cuts a longer one after 80 letters, never through an emoji", () => {
    expect(shortReason("a".repeat(81))).toBe(`${"a".repeat(80)}…`);
    expect(shortReason("😀".repeat(81))).toBe(`${"😀".repeat(80)}…`);
  });
});
