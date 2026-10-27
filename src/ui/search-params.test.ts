import { describe, expect, it } from "vitest";
import { firstParam, idParam } from "./search-params";

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

describe("idParam", () => {
  it("keeps any id the address names, for the read to answer not found", () => {
    expect(idParam(" bukan-id ")).toBe("bukan-id");
    expect(idParam("00000000-0000-4000-8000-000000000001")).toBe(
      "00000000-0000-4000-8000-000000000001",
    );
  });

  it("cuts a text longer than an id", () => {
    expect(idParam("a".repeat(50))).toBe("a".repeat(36));
  });

  it.each(["", "  ", undefined])("reads %o as no id", (value) => {
    expect(idParam(value)).toBeNull();
  });
});
