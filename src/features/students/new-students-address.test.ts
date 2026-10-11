import { describe, expect, it } from "vitest";
import {
  addressOf,
  newStudentsAddress,
  readNewStudentsParams,
} from "./new-students-address";

describe("readNewStudentsParams", () => {
  it("reads the search and the NIM of the student being changed", () => {
    expect(readNewStudentsParams({ q: " ayu ", ubah: "9900000001" })).toEqual({
      query: "ayu",
      editing: "9900000001",
    });
  });

  it.each([
    [{}],
    [{ q: "" }],
    [{ q: [] }],
    [{ ubah: "990000000" }],
    [{ ubah: "abc" }],
  ])("reads no search and no student from %o", (params) => {
    expect(readNewStudentsParams(params)).toEqual({ query: "", editing: null });
  });
});

describe("addressOf", () => {
  it("joins the path and what comes after it", () => {
    expect(addressOf("/pengaturan/mahasiswa", "")).toBe(
      "/pengaturan/mahasiswa",
    );
    expect(addressOf("/pengaturan/mahasiswa", "q=ayu")).toBe(
      "/pengaturan/mahasiswa?q=ayu",
    );
  });

  it.each(["", "ayu", "ayu l", "a&b=c", "50%", "é+1"])(
    "reads the address the list goes to for the search %o as that same address",
    (query) => {
      const target = newStudentsAddress(query);
      const arrived = new URL(target, "http://localhost");
      expect(addressOf(arrived.pathname, arrived.searchParams.toString())).toBe(
        target,
      );
    },
  );
});

describe("newStudentsAddress", () => {
  it("keeps the search, and leaves out what is empty", () => {
    expect(newStudentsAddress("")).toBe("/pengaturan/mahasiswa");
    expect(newStudentsAddress("ayu l")).toBe("/pengaturan/mahasiswa?q=ayu+l");
  });

  it("points at the form when a student is being changed", () => {
    expect(newStudentsAddress("ayu", "9900000001")).toBe(
      "/pengaturan/mahasiswa?q=ayu&ubah=9900000001#formulir",
    );
  });
});
