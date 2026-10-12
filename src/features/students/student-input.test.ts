// Sample NIMs of this file: 9900001200 to 9900001299.
import { describe, expect, it } from "vitest";
import {
  cohortChoices,
  parseStudent,
  type StudentFields,
} from "./student-input";

const context = {
  programs: [
    { id: 3, name: "Prodi Uji Satu" },
    { id: 7, name: "Prodi Uji Dua" },
  ],
  cohortYears: cohortChoices(2026),
  campusEnding: "@kampus.example",
};

const valid: StudentFields = {
  nim: "9900001201",
  name: "  Mahasiswa   Contoh ",
  email: "  Mahasiswa.Contoh@Kampus.Example ",
  studyProgramId: "7",
  entryPath: "transfer",
  sex: "female",
  cohortYear: "2025",
  className: " 1-01 ",
  province: "Jawa Barat",
  originAgency: "Direktorat Jenderal Pajak",
  status: "on_leave",
  categories: ["isAffirmation", "isBlended"],
};

describe("cohortChoices", () => {
  it("gives this year and the five before, the newest first", () => {
    expect(cohortChoices(2026)).toEqual([2026, 2025, 2024, 2023, 2022, 2021]);
  });

  it("adds the year a student already has, in its place and only once", () => {
    expect(cohortChoices(2026, 2019)).toEqual([
      2026, 2025, 2024, 2023, 2022, 2021, 2019,
    ]);
    expect(cohortChoices(2026, 2027)[0]).toBe(2027);
    expect(cohortChoices(2026, 2024)).toEqual(cohortChoices(2026));
  });
});

describe("parseStudent", () => {
  it("accepts a filled form, with its texts tidied", () => {
    expect(parseStudent(valid, context)).toEqual({
      ok: true,
      value: {
        nim: "9900001201",
        name: "Mahasiswa Contoh",
        email: "mahasiswa.contoh@kampus.example",
        studyProgramId: 7,
        entryPath: "transfer",
        sex: "female",
        cohortYear: 2025,
        className: "1-01",
        province: "Jawa Barat",
        originAgency: "Direktorat Jenderal Pajak",
        status: "on_leave",
        isAffirmation: true,
        isSeedling: false,
        isInternational: false,
        isBlended: true,
      },
    });
  });

  it("accepts a form with only what must be filled", () => {
    const parsed = parseStudent(
      {
        ...valid,
        email: " ",
        entryPath: "regular",
        className: "",
        province: "",
        originAgency: "",
        categories: [],
      },
      context,
    );
    expect(parsed).toMatchObject({
      ok: true,
      value: {
        email: null,
        className: null,
        province: null,
        originAgency: null,
        isAffirmation: false,
        isBlended: false,
      },
    });
  });

  it("accepts any well-formed address while the campus ending is empty", () => {
    const parsed = parseStudent(
      { ...valid, email: "mahasiswa.contoh@luar.example" },
      { ...context, campusEnding: "" },
    );
    expect(parsed).toMatchObject({
      ok: true,
      value: { email: "mahasiswa.contoh@luar.example" },
    });
  });

  it("keeps Instansi asal only for Alih program", () => {
    const parsed = parseStudent({ ...valid, entryPath: "regular" }, context);
    expect(parsed).toMatchObject({ ok: true, value: { originAgency: null } });
  });

  it.each([
    ["a NIM of 9 digits", { nim: "990000120" }, "NIM harus 10 digit angka."],
    ["a NIM of 11 digits", { nim: "99000012011" }, "NIM harus 10 digit angka."],
    ["a NIM with a letter", { nim: "99000012O1" }, "NIM harus 10 digit angka."],
    ["a name of 2 letters", { name: " Al " }, "Nama wajib diisi."],
    ["no name", { name: "" }, "Nama wajib diisi."],
    [
      "a name that is too long",
      { name: "a".repeat(101) },
      "Nama paling banyak 100 karakter.",
    ],
    [
      "an address that is not well formed",
      { email: "mahasiswa.contoh" },
      "Alamat email tidak valid.",
    ],
    [
      "an address that is too long",
      { email: `${"a".repeat(250)}@kampus.example` },
      "Alamat email tidak valid.",
    ],
    [
      "an address outside the campus",
      { email: "mahasiswa.contoh@luar.example" },
      "Gunakan alamat email kampus.",
    ],
    [
      "an unknown study program",
      { studyProgramId: "4" },
      "Program studi tidak dikenal.",
    ],
    [
      "no study program",
      { studyProgramId: "" },
      "Program studi tidak dikenal.",
    ],
    [
      "an unknown path",
      { entryPath: "other" },
      "Jalur harus Reguler atau Alih program.",
    ],
    [
      "an unknown sex",
      { sex: "" },
      "Jenis kelamin harus Laki-laki atau Perempuan.",
    ],
    [
      "a year before the choices",
      { cohortYear: "2020" },
      "Angkatan tidak valid (contoh 2026).",
    ],
    [
      "a year after the choices",
      { cohortYear: "2027" },
      "Angkatan tidak valid (contoh 2026).",
    ],
    [
      "a year that is not a number",
      { cohortYear: "dua" },
      "Angkatan tidak valid (contoh 2026).",
    ],
    [
      "a class that is too long",
      { className: "1".repeat(21) },
      "Kelas akademik paling banyak 20 karakter.",
    ],
    [
      "an unknown province",
      { province: "Atlantis" },
      "Provinsi tidak dikenal.",
    ],
    [
      "an unknown agency",
      { originAgency: "Instansi Lain" },
      "Instansi asal tidak dikenal.",
    ],
    [
      "an unknown status",
      { status: "gone" },
      "Status harus Aktif, Cuti, atau Non Aktif.",
    ],
    [
      "an unknown category",
      { categories: ["isAdmin"] },
      "Kategori tidak dikenal.",
    ],
  ])("refuses %s", (_case, change, error) => {
    expect(parseStudent({ ...valid, ...change }, context)).toEqual({
      ok: false,
      error,
    });
  });
});
