import { describe, expect, it } from "vitest";
import { templateCsv, yearRange } from "./student-file-columns";

describe("templateCsv", () => {
  it("holds the column titles, tanggal_lahir last, and one made-up example row with no address", () => {
    expect(templateCsv().split("\n")).toEqual([
      "nim,nama,prodi,jalur,jenis_kelamin,angkatan,kelas,provinsi,instansi_asal,afirmasi,pembibitan,internasional,status,email,agama,tanggal_lahir",
      "4121260001,Nama Mahasiswa,Manajemen Keuangan Negara STR,Reguler,P,2026,1-01,Jawa Barat,,tidak,tidak,tidak,Aktif,,Islam,08/17/2005",
      "",
    ]);
  });
});

describe("yearRange", () => {
  it("names the oldest and the newest year, whatever their order", () => {
    expect(yearRange([2026, 2025, 2024, 2023, 2022, 2021])).toBe(
      "2021 sampai 2026",
    );
  });
});
