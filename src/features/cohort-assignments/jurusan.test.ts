import { describe, expect, it } from "vitest";
import { isOfJurusan, jurusanOf } from "./jurusan";

describe("jurusanOf", () => {
  it.each([
    ["D3 Pajak", "Jurusan Pajak"],
    ["D3 PBB/Penilai", "Jurusan Pajak"],
    ["D3 Akuntansi", "Jurusan Akuntansi"],
    ["Akuntansi Sektor Publik STR", "Jurusan Akuntansi"],
    ["D3 Kepabeanan dan Cukai", "Jurusan Kepabeanan dan Cukai"],
    ["D3 Kebendaharaan Negara", "Jurusan Manajemen Keuangan"],
    ["D3 Manajemen Aset", "Jurusan Manajemen Keuangan"],
    ["Manajemen Aset Publik STR", "Jurusan Manajemen Keuangan"],
    ["Manajemen Keuangan Negara STR", "Jurusan Manajemen Keuangan"],
  ])("puts %s in %s", (program, jurusan) => {
    expect(jurusanOf(program)).toBe(jurusan);
  });

  it("looks for Pajak and PBB before Akuntansi, and Akuntansi before Kepabeanan", () => {
    expect(jurusanOf("Akuntansi Pajak")).toBe("Jurusan Pajak");
    expect(jurusanOf("Akuntansi PBB")).toBe("Jurusan Pajak");
    expect(jurusanOf("Akuntansi Kepabeanan")).toBe("Jurusan Akuntansi");
  });

  it("puts any other name in Jurusan Manajemen Keuangan", () => {
    expect(jurusanOf("Prodi Baru")).toBe("Jurusan Manajemen Keuangan");
    expect(jurusanOf("")).toBe("Jurusan Manajemen Keuangan");
  });

  it("reads the name as it is written, letter case and all", () => {
    expect(jurusanOf("d3 pajak")).toBe("Jurusan Manajemen Keuangan");
  });
});

describe("isOfJurusan", () => {
  it("matches a mentor whose unit is the jurusan of the program studi", () => {
    expect(isOfJurusan("Jurusan Pajak", "D3 Pajak")).toBe(true);
    expect(isOfJurusan("Jurusan Akuntansi", "D3 Akuntansi")).toBe(true);
  });

  it("does not match a mentor of another unit, or of none", () => {
    expect(isOfJurusan("Jurusan Akuntansi", "D3 Pajak")).toBe(false);
    expect(isOfJurusan("Unit Pembangunan Karakter", "D3 Pajak")).toBe(false);
    expect(isOfJurusan(null, "D3 Pajak")).toBe(false);
  });
});
