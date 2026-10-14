import { describe, expect, it } from "vitest";
import { MAX_FILE_ROWS } from "./csv-file";
import { readTitledRows, type TitledFile } from "./titled-rows";

const FILE: TitledFile = {
  columns: [
    { title: "kode", others: ["no"] },
    { title: "nama", others: [] },
    { title: "catatan", others: [] },
  ],
  optional: ["catatan"],
  startsRecord: (cell) => /^\d+$/.test(cell),
  noun: "barang",
};

function read(...lines: string[]) {
  return readTitledRows(lines.join("\n"), FILE);
}

describe("readTitledRows", () => {
  it("follows the titles of the first row, in any order and spelling, and numbers each row by its line", () => {
    expect(read("Nama,NO,catatan", "Satu, 1 ,a", "", "Dua,2,b")).toEqual({
      ok: true,
      value: [
        { row: 2, cells: ["1", "Satu", "a"] },
        { row: 4, cells: ["2", "Dua", "b"] },
      ],
    });
  });

  it("reads the order of the template when the first row is a record", () => {
    expect(read("1,nama,x")).toEqual({
      ok: true,
      value: [{ row: 1, cells: ["1", "nama", "x"] }],
    });
  });

  it("gives an optional column the file leaves out empty cells", () => {
    expect(read("kode,nama", "1,Satu")).toEqual({
      ok: true,
      value: [{ row: 2, cells: ["1", "Satu", ""] }],
    });
  });

  it("names the columns the titles lack", () => {
    expect(read("kode,catatan", "1,a")).toEqual({
      ok: false,
      error: "Kolom tidak ditemukan: nama. Samakan judul kolom dengan templat.",
    });
  });

  it("names what a row holds when the file has no row", () => {
    expect(read("kode,nama")).toEqual({
      ok: false,
      error:
        "Berkas tidak berisi baris barang. Isi berkas sesuai templat, lalu unggah lagi.",
    });
  });

  it("reads the most rows allowed, and refuses one row more with what a row holds", () => {
    const rows = Array.from(
      { length: MAX_FILE_ROWS + 1 },
      (_, at) => `${at},x`,
    );

    const full = read("kode,nama", ...rows.slice(0, MAX_FILE_ROWS));
    const over = read("kode,nama", ...rows);

    expect(full.ok && full.value).toHaveLength(MAX_FILE_ROWS);
    expect(over).toEqual({
      ok: false,
      error:
        "Berkas berisi 1.001 baris barang, paling banyak 1.000. Bagi menjadi beberapa berkas, lalu unggah satu per satu.",
    });
  });
});
