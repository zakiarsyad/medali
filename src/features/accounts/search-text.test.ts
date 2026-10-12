import { describe, expect, it } from "vitest";
import { SEARCH_TEXT_MAX, searchText } from "./search-text";

describe("searchText", () => {
  it("gives the text without the spaces around it", () => {
    expect(searchText("  laras uji ")).toBe("laras uji");
  });

  it("gives nothing for an empty text", () => {
    expect(searchText("   ")).toBeNull();
  });

  it("takes a text as long as the search field takes, and none longer", () => {
    expect(searchText("a".repeat(SEARCH_TEXT_MAX))).toHaveLength(100);
    expect(searchText("a".repeat(SEARCH_TEXT_MAX + 1))).toBeNull();
  });

  it("counts the length before the spaces around it are dropped", () => {
    expect(searchText(` ${"a".repeat(SEARCH_TEXT_MAX)}`)).toBeNull();
  });
});
