import { describe, expect, it } from "vitest";
import { listAddress, readListParams } from "./list-address";

const NOTHING = {
  query: "",
  role: null,
  page: 0,
  editing: null,
  bamPage: 0,
  bamEditing: null,
};
const FIRST_PAGES = { query: "", role: null, page: 0, bamPage: 0 };

describe("readListParams", () => {
  it("reads the search, the role, the page and the account being edited", () => {
    expect(
      readListParams({ q: " budi ", peran: "mentor", hal: "2", ubah: "abc" }),
    ).toEqual({
      ...NOTHING,
      query: "budi",
      role: "mentor",
      page: 1,
      editing: "abc",
    });
  });

  it("reads the page of the BAM students and the one being edited", () => {
    expect(readListParams({ halBam: "3", ubahBam: "def" })).toEqual({
      ...NOTHING,
      bamPage: 2,
      bamEditing: "def",
    });
  });

  it("keeps the two lists' pages and edits apart", () => {
    expect(
      readListParams({ hal: "2", ubah: "abc", halBam: "4", ubahBam: "def" }),
    ).toEqual({
      ...NOTHING,
      page: 1,
      editing: "abc",
      bamPage: 3,
      bamEditing: "def",
    });
  });

  it.each([
    [{}, NOTHING],
    [{ peran: "student" }, NOTHING],
    [{ hal: "-3" }, NOTHING],
    [{ hal: "x" }, NOTHING],
    [{ halBam: "0" }, NOTHING],
    [{ halBam: "x" }, NOTHING],
    [{ q: ["a", "b"] }, { ...NOTHING, query: "a" }],
  ])("falls back on what it cannot read: %o", (params, expected) => {
    expect(readListParams(params)).toEqual(expected);
  });

  it("drops the null character from the search", () => {
    expect(readListParams({ q: "\0bu\0 di\0" }).query).toBe("bu di");
    expect(readListParams({ q: "\0 \0 " })).toEqual(NOTHING);
  });
});

describe("listAddress", () => {
  it("keeps the search and the role, and leaves out what is empty", () => {
    expect(listAddress({ ...FIRST_PAGES, query: "budi", role: "mentor" })).toBe(
      "/pengaturan/pengguna?q=budi&peran=mentor",
    );
    expect(listAddress({ ...FIRST_PAGES, page: 2 }, { edit: "abc" })).toBe(
      "/pengaturan/pengguna?hal=3&ubah=abc",
    );
  });

  it("keeps the staff list as it is in a link of the BAM students", () => {
    expect(
      listAddress(
        { query: "budi", role: "mentor", page: 1, bamPage: 2 },
        { bamEdit: "def" },
      ),
    ).toBe(
      "/pengaturan/pengguna?q=budi&peran=mentor&hal=2&halBam=3&ubahBam=def",
    );
  });

  it("keeps the page of the BAM students in a link of the staff list", () => {
    expect(
      listAddress({ ...FIRST_PAGES, page: 1, bamPage: 1 }, { edit: "abc" }),
    ).toBe("/pengaturan/pengguna?hal=2&ubah=abc&halBam=2");
  });

  it("reads back what it wrote", () => {
    const view = {
      query: "budi",
      role: "mentor",
      page: 1,
      bamPage: 2,
    } as const;
    const address = new URL(listAddress(view), "http://contoh.test");
    const read = readListParams(Object.fromEntries(address.searchParams));
    expect(read).toEqual({ ...view, editing: null, bamEditing: null });
  });
});
