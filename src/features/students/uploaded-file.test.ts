import { describe, expect, it } from "vitest";
import { MAX_FILE_BYTES } from "./student-file-columns";
import { checkFileShape, readFileText, sourceName } from "./uploaded-file";

const NOT_CSV =
  "Berkas harus berformat CSV. Simpan berkas sebagai CSV sesuai templat, lalu unggah lagi.";

describe("checkFileShape", () => {
  it("accepts a CSV file up to the largest size", () => {
    expect(checkFileShape("mahasiswa.csv", 1)).toBeNull();
    expect(checkFileShape("MAHASISWA.CSV", MAX_FILE_BYTES)).toBeNull();
  });

  it.each(["mahasiswa.xlsx", "mahasiswa.csv.exe", "mahasiswa", "csv"])(
    "refuses %s, which is not a CSV file",
    (name) => {
      expect(checkFileShape(name, 10)).toBe(NOT_CSV);
    },
  );

  it("refuses an empty file", () => {
    expect(checkFileShape("mahasiswa.csv", 0)).toBe(
      "Berkas kosong. Isi berkas sesuai templat, lalu unggah lagi.",
    );
  });

  it("refuses a file one byte over the largest size", () => {
    expect(checkFileShape("mahasiswa.csv", MAX_FILE_BYTES + 1)).toBe(
      "Ukuran berkas lebih dari 1 MB. Bagi menjadi beberapa berkas, lalu unggah satu per satu.",
    );
  });
});

describe("readFileText", () => {
  it("reads the text of a file", () => {
    const bytes = new TextEncoder().encode("nim,nama\n1,Uji Élan\n");

    expect(readFileText(bytes)).toEqual({
      ok: true,
      value: "nim,nama\n1,Uji Élan\n",
    });
  });

  it("refuses a spreadsheet file that was only renamed", () => {
    const bytes = new Uint8Array([80, 75, 3, 4, 0, 0, 0, 0]);

    expect(readFileText(bytes)).toEqual({ ok: false, error: NOT_CSV });
  });

  it("refuses text that is not saved as UTF-8", () => {
    const bytes = new Uint8Array([110, 105, 109, 10, 233, 10]);

    expect(readFileText(bytes)).toEqual({
      ok: false,
      error:
        "Berkas tidak bisa dibaca. Simpan berkas sebagai CSV UTF-8 sesuai templat, lalu unggah lagi.",
    });
  });
});

describe("sourceName", () => {
  it("keeps an ordinary file name as it is", () => {
    expect(sourceName("mahasiswa-baru 2026.csv")).toBe(
      "mahasiswa-baru 2026.csv",
    );
  });

  it("puts a name on one line, without characters that do not show", () => {
    expect(sourceName("  maha\nsiswa\t‮baru\u0000.csv ")).toBe(
      "maha siswa baru .csv",
    );
  });

  it("cuts a long name short", () => {
    expect(sourceName(`${"a".repeat(200)}.csv`)).toBe("a".repeat(60));
  });
});
