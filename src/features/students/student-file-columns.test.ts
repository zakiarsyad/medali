import { describe, expect, it } from "vitest";
import { templateCsv } from "./student-file-columns";

describe("templateCsv", () => {
  it("holds the column titles and one made-up example row", () => {
    expect(templateCsv().split("\n")).toEqual([
      "nim,nama,prodi,jalur,jenis_kelamin,angkatan,kelas,provinsi,instansi_asal,afirmasi,pembibitan,internasional,status",
      "4121260001,Nama Mahasiswa,Manajemen Keuangan Negara STR,Reguler,P,2026,1-01,Jawa Barat,,tidak,tidak,tidak,Aktif",
      "",
    ]);
  });
});
