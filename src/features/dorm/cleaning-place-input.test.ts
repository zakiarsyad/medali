import { describe, expect, it } from "vitest";
import { parseDorm, parsePlaceName } from "./cleaning-place-input";

describe("parsePlaceName", () => {
  it("keeps a name without the spaces around it", () => {
    expect(parsePlaceName("  Koridor lantai 2 ")).toEqual({
      ok: true,
      value: "Koridor lantai 2",
    });
  });

  it.each(["", "  ", "Ab", " Ab "])("refuses %j as under 3 letters", (sent) => {
    expect(parsePlaceName(sent)).toEqual({
      ok: false,
      error: "Nama tempat minimal 3 huruf.",
    });
  });

  it("takes a name of 3 and of 60 letters", () => {
    expect(parsePlaceName("Abc").ok).toBe(true);
    expect(parsePlaceName("A".repeat(60)).ok).toBe(true);
  });

  it("counts a sign such as an emoji once, as the database does", () => {
    expect(parsePlaceName("🧹a").ok).toBe(false);
    expect(parsePlaceName("🧹".repeat(60)).ok).toBe(true);
  });

  it("refuses a name over 60 letters", () => {
    expect(parsePlaceName("A".repeat(61))).toEqual({
      ok: false,
      error: "Nama tempat paling panjang 60 huruf.",
    });
  });
});

describe("parseDorm", () => {
  it("takes one of the four dorms", () => {
    expect(parseDorm("cipta_bakti")).toEqual({
      ok: true,
      value: "cipta_bakti",
    });
  });

  it.each(["", "asrama_lain"])("refuses %j", (sent) => {
    expect(parseDorm(sent)).toEqual({ ok: false, error: "Pilih asrama." });
  });
});
