import { describe, expect, it } from "vitest";
import {
  NO_FILTERS,
  readStudentListParams,
  studentListAddress,
} from "./student-list-address";

describe("readStudentListParams", () => {
  it("starts on Aktif dan cuti with nothing else chosen", () => {
    expect(readStudentListParams({})).toEqual({ filters: NO_FILTERS });
    expect(NO_FILTERS).toEqual({
      query: "",
      cohortYear: null,
      status: "current",
    });
  });

  it("reads the search, the angkatan and the status", () => {
    const read = readStudentListParams({
      q: "  ayu ",
      angkatan: "2024",
      status: "nonaktif",
    });

    expect(read.filters).toEqual({
      query: "ayu",
      cohortYear: 2024,
      status: "inactive",
    });
    expect(readStudentListParams({ status: "semua" }).filters.status).toBe(
      "all",
    );
  });

  it.each(["", "24", "20245", "abcd", "2024.5", "-2024", "2024 or 1=1"])(
    "falls back to every angkatan for %j",
    (angkatan) => {
      expect(readStudentListParams({ angkatan }).filters.cohortYear).toBeNull();
    },
  );

  it.each(["", "aktif", "inactive", "apa saja"])(
    "falls back to Aktif dan cuti for the status %j",
    (status) => {
      expect(readStudentListParams({ status }).filters.status).toBe("current");
    },
  );

  it("takes the first of a part that is repeated", () => {
    const read = readStudentListParams({ q: ["satu", "dua"] });

    expect(read.filters.query).toBe("satu");
  });

  it("cuts a search that is longer than a name can be", () => {
    const read = readStudentListParams({ q: "a".repeat(500) });

    expect(read.filters.query).toHaveLength(100);
  });
});

describe("studentListAddress", () => {
  it("is the plain address when nothing is chosen", () => {
    expect(studentListAddress(NO_FILTERS)).toBe("/mahasiswa");
  });

  it("holds what is chosen, and reads back the same", () => {
    const filters = {
      query: "ayu & budi",
      cohortYear: 2023,
      status: "all" as const,
    };

    const address = studentListAddress(filters);

    expect(address).toBe(
      "/mahasiswa?q=ayu+%26+budi&angkatan=2023&status=semua",
    );
    const search = new URLSearchParams(address.split("?")[1]);
    expect(readStudentListParams(Object.fromEntries(search)).filters).toEqual(
      filters,
    );
  });
});
