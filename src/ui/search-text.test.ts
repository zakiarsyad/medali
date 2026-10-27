import { describe, expect, it } from "vitest";
import {
  SEARCH_TEXT_MAX,
  searchText,
  withoutNullCharacter,
} from "./search-text";

describe("withoutNullCharacter", () => {
  it("drops every null character and keeps the rest as it is", () => {
    expect(withoutNullCharacter("\0 laras\0 uji \0")).toBe(" laras uji ");
  });
});

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

  it("drops the null character, which the database refuses", () => {
    expect(searchText("\0laras\0 uji\0")).toBe("laras uji");
  });

  it("gives nothing for a text of only null characters and spaces", () => {
    expect(searchText("\0 \0\0 ")).toBeNull();
  });

  it("counts the length once the null characters are dropped", () => {
    expect(searchText(`\0${"a".repeat(SEARCH_TEXT_MAX)}\0`)).toHaveLength(100);
  });
});
