import { describe, expect, it } from "vitest";
import { containsPattern } from "./contains-pattern";

describe("containsPattern", () => {
  it("matches the text anywhere in a value", () => {
    expect(containsPattern("budi")).toBe("%budi%");
  });

  it("takes the signs of a pattern as written", () => {
    expect(containsPattern("50%_a\\b")).toBe("%50\\%\\_a\\\\b%");
  });
});
