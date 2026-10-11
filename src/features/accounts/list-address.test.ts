import { describe, expect, it } from "vitest";
import { listAddress, readListParams } from "./list-address";

describe("readListParams", () => {
  it("reads the search, the role, the page and the account being edited", () => {
    expect(
      readListParams({ q: " budi ", peran: "mentor", hal: "2", ubah: "abc" }),
    ).toEqual({ query: "budi", role: "mentor", page: 1, editing: "abc" });
  });

  it.each([
    [{}, { query: "", role: null, page: 0, editing: null }],
    [{ peran: "student" }, { query: "", role: null, page: 0, editing: null }],
    [{ hal: "-3" }, { query: "", role: null, page: 0, editing: null }],
    [{ hal: "x" }, { query: "", role: null, page: 0, editing: null }],
    [{ q: ["a", "b"] }, { query: "a", role: null, page: 0, editing: null }],
  ])("falls back on what it cannot read: %o", (params, expected) => {
    expect(readListParams(params)).toEqual(expected);
  });
});

describe("listAddress", () => {
  it("keeps the search and the role, and leaves out what is empty", () => {
    expect(listAddress({ query: "budi", role: "mentor", page: 0 })).toBe(
      "/pengaturan/pengguna?q=budi&peran=mentor",
    );
    expect(
      listAddress({ query: "", role: null, page: 2 }, { edit: "abc" }),
    ).toBe("/pengaturan/pengguna?hal=3&ubah=abc");
  });
});
