import { describe, expect, it } from "vitest";
import {
  NO_FILTERS,
  readStudentListParams,
  studentListAddress,
  topFiltersInUse,
  withoutTopFilters,
} from "./student-list-address";

describe("readStudentListParams", () => {
  it("starts on Aktif dan cuti with nothing else chosen", () => {
    expect(readStudentListParams({})).toEqual({
      filters: NO_FILTERS,
      page: 1,
    });
    expect(NO_FILTERS).toEqual({
      query: "",
      cohortYear: null,
      status: "current",
      studyProgramId: null,
      entryPath: null,
      category: null,
    });
  });

  it("reads the program studi, the jalur and the kategori", () => {
    const read = readStudentListParams({
      prodi: "7",
      jalur: "transfer",
      kategori: "isSeedling",
    });

    expect(read.filters).toEqual({
      ...NO_FILTERS,
      studyProgramId: 7,
      entryPath: "transfer",
      category: "isSeedling",
    });
  });

  it.each(["", "0", "-3", "1.5", "abc", "12345678901", "7 or 1=1"])(
    "falls back to every program studi for %j",
    (prodi) => {
      const read = readStudentListParams({ prodi });

      expect(read.filters.studyProgramId).toBeNull();
    },
  );

  it("falls back to every jalur and kategori for a choice that does not exist", () => {
    const read = readStudentListParams({ jalur: "Reguler", kategori: "nim" });

    expect(read.filters.entryPath).toBeNull();
    expect(read.filters.category).toBeNull();
  });

  it("reads the search, the angkatan and the status", () => {
    const read = readStudentListParams({
      q: "  ayu ",
      angkatan: "2024",
      status: "nonaktif",
    });

    expect(read.filters).toEqual({
      ...NO_FILTERS,
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
      studyProgramId: 4,
      entryPath: "regular" as const,
      category: "isBlended" as const,
    };

    const address = studentListAddress(filters);

    expect(address).toBe(
      "/mahasiswa?q=ayu+%26+budi&angkatan=2023&status=semua&prodi=4&jalur=regular&kategori=isBlended",
    );
    const search = new URLSearchParams(address.split("?")[1]);
    expect(readStudentListParams(Object.fromEntries(search)).filters).toEqual(
      filters,
    );
  });
});

describe("the filters of the top bar", () => {
  const chosen = {
    ...NO_FILTERS,
    query: "ayu",
    status: "all" as const,
    studyProgramId: 4,
    category: "isAffirmation" as const,
  };

  it("are counted when in use, and the others are not", () => {
    expect(topFiltersInUse(NO_FILTERS)).toBe(0);
    const searched = { ...NO_FILTERS, query: "ayu" };
    expect(topFiltersInUse(searched)).toBe(0);
    expect(topFiltersInUse(chosen)).toBe(2);
    expect(topFiltersInUse({ ...chosen, entryPath: "regular" })).toBe(3);
  });

  it("are cleared alone, and the search and the status stay", () => {
    expect(withoutTopFilters(chosen)).toEqual({
      ...NO_FILTERS,
      query: "ayu",
      status: "all",
    });
  });
});

describe("the page of the list", () => {
  it("is read from the address", () => {
    expect(readStudentListParams({ hal: "3" }).page).toBe(3);
  });

  it.each(["", "0", "-1", "1.5", "dua", "1234567", "2; drop"])(
    "falls back to the first page for %j",
    (hal) => {
      expect(readStudentListParams({ hal }).page).toBe(1);
    },
  );

  it("is in the address only after the first, next to the filters", () => {
    const filters = { ...NO_FILTERS, query: "ayu" };

    expect(studentListAddress(filters, 1)).toBe("/mahasiswa?q=ayu");
    expect(studentListAddress(filters, 2)).toBe("/mahasiswa?q=ayu&hal=2");
    expect(studentListAddress(NO_FILTERS, 3)).toBe("/mahasiswa?hal=3");
  });
});
