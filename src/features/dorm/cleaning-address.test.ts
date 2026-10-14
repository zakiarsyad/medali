import { describe, expect, it } from "vitest";
import {
  cleaningAddress,
  readCleaningParams,
  shownDorms,
} from "./cleaning-address";

describe("readCleaningParams", () => {
  it("opens Semua asrama", () => {
    expect(readCleaningParams({})).toEqual({ dorm: null });
  });

  it("reads the dorm, the first when given twice", () => {
    expect(readCleaningParams({ asrama: "dana_rakca" }).dorm).toBe(
      "dana_rakca",
    );
    expect(
      readCleaningParams({ asrama: ["cipta_bakti", "dana_rakca"] }).dorm,
    ).toBe("cipta_bakti");
  });

  it("opens Semua asrama for a dorm that is not one", () => {
    expect(readCleaningParams({ asrama: "asrama_lain" }).dorm).toBeNull();
  });
});

describe("shownDorms", () => {
  it("shows all four dorms for Semua asrama, and one dorm when picked", () => {
    expect(shownDorms({ dorm: null })).toHaveLength(4);
    expect(shownDorms({ dorm: "cipta_bakti" })).toEqual(["cipta_bakti"]);
  });
});

describe("cleaningAddress", () => {
  it("leaves Semua asrama out, and names a dorm", () => {
    expect(cleaningAddress({ dorm: null })).toBe("/asrama/bersih");
    expect(cleaningAddress({ dorm: "dana_rakca" })).toBe(
      "/asrama/bersih?asrama=dana_rakca",
    );
  });

  it("gives back what it is read as", () => {
    const params = { dorm: "wismantara_putri" } as const;
    const query = cleaningAddress(params).split("?")[1] ?? "";
    const read = readCleaningParams(
      Object.fromEntries(new URLSearchParams(query)),
    );

    expect(read).toEqual(params);
  });
});
