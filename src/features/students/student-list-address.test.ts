// Sample NIMs of this file: 9900001700 to 9900001799.
import { describe, expect, it } from "vitest";
import {
  NO_AGENCY,
  NO_DORM,
  NO_FILTERS,
  readStudentListParams,
  type StudentListFilters,
  studentDetailAddress,
  studentListAddress,
  topFiltersInUse,
  withoutTopFilters,
} from "./student-list-address";

describe("readStudentListParams", () => {
  it("starts on Aktif dan cuti with nothing else chosen", () => {
    expect(readStudentListParams({})).toEqual({
      filters: NO_FILTERS,
      page: 1,
      detailId: null,
    });
    expect(NO_FILTERS).toEqual({
      query: "",
      cohortYear: null,
      status: "current",
      studyProgramId: null,
      entryPath: null,
      category: null,
      stageNo: null,
      province: null,
      originAgency: null,
      dorm: null,
    });
  });

  it("reads the asrama: a dorm, or the students of none", () => {
    expect(readStudentListParams({ asrama: "cipta_bakti" }).filters.dorm).toBe(
      "cipta_bakti",
    );
    expect(readStudentListParams({ asrama: "non" }).filters.dorm).toBe(NO_DORM);
  });

  it.each(["", "Asrama Dana Rakca", "dana", "non ", "1 or 1=1"])(
    "falls back to every asrama for %j",
    (asrama) => {
      expect(readStudentListParams({ asrama }).filters.dorm).toBeNull();
    },
  );

  it("reads the tahap, the provinsi and the instansi", () => {
    const read = readStudentListParams({
      tahap: "3",
      provinsi: "Jawa Barat",
      instansi: "Direktorat Jenderal Pajak",
    });

    expect(read.filters).toEqual({
      ...NO_FILTERS,
      stageNo: 3,
      province: "Jawa Barat",
      originAgency: "Direktorat Jenderal Pajak",
    });
    expect(
      readStudentListParams({ instansi: "tanpa" }).filters.originAgency,
    ).toBe(NO_AGENCY);
  });

  it.each(["", "0", "5", "1.5", "satu", "12", "1 or 1=1"])(
    "falls back to every tahap for %j",
    (tahap) => {
      expect(readStudentListParams({ tahap }).filters.stageNo).toBeNull();
    },
  );

  it("falls back to every provinsi and instansi for one that is not listed", () => {
    const read = readStudentListParams({
      provinsi: "jawa barat",
      instansi: "Kantor Yang Tidak Ada",
    });

    expect(read.filters.province).toBeNull();
    expect(read.filters.originAgency).toBeNull();
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
      stageNo: 2,
      province: "DKI Jakarta",
      originAgency: NO_AGENCY,
      dorm: "dana_rakca" as const,
    };

    const address = studentListAddress(filters);

    expect(address).toBe(
      "/mahasiswa?q=ayu+%26+budi&angkatan=2023&status=semua&prodi=4&jalur=regular&kategori=isBlended&tahap=2&provinsi=DKI+Jakarta&instansi=tanpa&asrama=dana_rakca",
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

  it("count the tahap, the provinsi and the instansi too", () => {
    const more = {
      ...chosen,
      stageNo: 1,
      province: "Bali",
      originAgency: NO_AGENCY,
    };

    expect(topFiltersInUse(more)).toBe(5);
    expect(withoutTopFilters(more)).toEqual(withoutTopFilters(chosen));
  });

  it("count the asrama too, and clear it with the others", () => {
    const inDorm: StudentListFilters = { ...chosen, dorm: NO_DORM };

    expect(topFiltersInUse(inDorm)).toBe(3);
    expect(withoutTopFilters(inDorm)).toEqual(withoutTopFilters(chosen));
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

describe("the student whose detail is open", () => {
  const ID = "0b7c1f4e-3a52-4d0c-9e8f-6a1b2c3d4e5f";

  it("is none when the address names none", () => {
    expect(readStudentListParams({}).detailId).toBeNull();
    expect(readStudentListParams({ profil: "  " }).detailId).toBeNull();
  });

  it("is read from the address, next to the filters and the page", () => {
    const read = readStudentListParams({ q: "ayu", hal: "2", profil: ID });

    expect(read.detailId).toBe(ID);
    expect(read.page).toBe(2);
    expect(read.filters.query).toBe("ayu");
  });

  it("is kept as asked when it is no id, and cut when it is long", () => {
    expect(readStudentListParams({ profil: "9900001701" }).detailId).toBe(
      "9900001701",
    );
    expect(
      readStudentListParams({ profil: "x".repeat(500) }).detailId,
    ).toHaveLength(36);
  });

  it("is added to the address of the list it opens over", () => {
    const filters = { ...NO_FILTERS, query: "ayu" };

    expect(studentDetailAddress(filters, 2, ID)).toBe(
      `/mahasiswa?q=ayu&hal=2&profil=${ID}`,
    );
    expect(studentDetailAddress(NO_FILTERS, 1, ID)).toBe(
      `/mahasiswa?profil=${ID}`,
    );
  });
});
