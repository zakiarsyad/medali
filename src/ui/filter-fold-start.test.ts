import { describe, expect, it } from "vitest";
import { filterFoldStartsOpen } from "./filter-fold-start";

describe("filterFoldStartsOpen", () => {
  it("starts closed while no filter is in use", () => {
    expect(filterFoldStartsOpen(0)).toBe(false);
  });

  it("starts open while a filter is in use", () => {
    expect(filterFoldStartsOpen(1)).toBe(true);
    expect(filterFoldStartsOpen(6)).toBe(true);
  });
});
