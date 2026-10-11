import { describe, expect, it } from "vitest";
import { isUuid } from "./is-uuid";

describe("isUuid", () => {
  it("takes a row id", () => {
    expect(isUuid("3f2b8c1e-9a4d-4e7b-8c1a-0d5e6f7a8b9c")).toBe(true);
  });

  it.each(["", "abc", "3f2b8c1e-9a4d-4e7b-8c1a-0d5e6f7a8b9c; drop"])(
    "refuses '%s'",
    (text) => {
      expect(isUuid(text)).toBe(false);
    },
  );
});
