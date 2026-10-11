import { describe, expect, it } from "vitest";
import { firstParam } from "./search-params";

describe("firstParam", () => {
  it.each([
    ["budi", "budi"],
    [["a", "b"], "a"],
    [[], ""],
    [undefined, ""],
  ])("reads %o as one text", (value, expected) => {
    expect(firstParam(value)).toBe(expected);
  });
});
