// Sample NIMs of this file: 9900002100 to 9900002199.
import { describe, expect, it } from "vitest";
import {
  addressOf,
  newStudentsAddress,
  readNewStudentsParams,
  studentFileAddress,
} from "./new-students-address";

describe("readNewStudentsParams", () => {
  it("reads the search, the page and the NIM of the student being changed", () => {
    expect(
      readNewStudentsParams({ q: " ayu ", hal: "3", ubah: "9900002101" }),
    ).toEqual({ query: "ayu", page: 3, editing: "9900002101" });
  });

  it("drops the null character from the search", () => {
    expect(readNewStudentsParams({ q: "\0ayu\0 la\0" }).query).toBe("ayu la");
  });

  it.each([
    [{}],
    [{ q: "" }],
    [{ q: [] }],
    [{ q: "\0 \0 " }],
    [{ ubah: "990000210" }],
    [{ ubah: "abc" }],
  ])("reads no search and no student from %o", (params) => {
    expect(readNewStudentsParams(params)).toEqual({
      query: "",
      page: 1,
      editing: null,
    });
  });

  it.each(["", "0", "-2", "1.5", "abc", "2x", "1234567"])(
    "reads the first page from a page of %o",
    (hal) => {
      expect(readNewStudentsParams({ hal }).page).toBe(1);
    },
  );
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
      const target = newStudentsAddress({ query, page: 2 });
      const arrived = new URL(target, "http://localhost");
      expect(addressOf(arrived.pathname, arrived.searchParams.toString())).toBe(
        target,
      );
    },
  );
});

describe("studentFileAddress", () => {
  it("gives the address that downloads a kept file", () => {
    expect(studentFileAddress("7c9e6679-7425-40de-944b-e07fc1f90ae7")).toBe(
      "/pengaturan/mahasiswa/berkas/7c9e6679-7425-40de-944b-e07fc1f90ae7",
    );
  });
});

describe("newStudentsAddress", () => {
  it("keeps the search and the page, and leaves out what is empty or first", () => {
    expect(newStudentsAddress({ query: "", page: 1 })).toBe(
      "/pengaturan/mahasiswa",
    );
    expect(newStudentsAddress({ query: "ayu l", page: 1 })).toBe(
      "/pengaturan/mahasiswa?q=ayu+l",
    );
    expect(newStudentsAddress({ query: "", page: 2 })).toBe(
      "/pengaturan/mahasiswa?hal=2",
    );
    expect(newStudentsAddress({ query: "ayu", page: 3 })).toBe(
      "/pengaturan/mahasiswa?q=ayu&hal=3",
    );
  });

  it("points at the form when a student is being changed", () => {
    expect(newStudentsAddress({ query: "ayu", page: 2 }, "9900002101")).toBe(
      "/pengaturan/mahasiswa?q=ayu&hal=2&ubah=9900002101#formulir",
    );
  });
});
