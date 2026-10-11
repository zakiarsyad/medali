import { describe, expect, it } from "vitest";
import { readCsv } from "./csv-text";

function rows(text: string): string[][] {
  const read = readCsv(text);
  if (!read.ok) throw new Error(read.error);
  return read.value;
}

describe("readCsv", () => {
  it("reads rows of cells, with or without a last line break", () => {
    expect(rows("a,b\nc,d")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
    expect(rows("a,b\nc,d\n")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("reads Windows and old Mac line breaks", () => {
    expect(rows("a,b\r\nc,d\re,f")).toEqual([
      ["a", "b"],
      ["c", "d"],
      ["e", "f"],
    ]);
  });

  it("reads a quoted cell with a comma, a line break and a doubled quote", () => {
    expect(rows('1,"Uji, Contoh","baris\nkedua","kata ""kutip"""\n')).toEqual([
      ["1", "Uji, Contoh", "baris\nkedua", 'kata "kutip"'],
    ]);
  });

  it("leaves out the byte-order mark a spreadsheet puts first", () => {
    expect(rows("\uFEFFnim,nama\n")).toEqual([["nim", "nama"]]);
  });

  it("reads semicolons when the first line has more of them than commas", () => {
    expect(rows("nim;nama\n1;Uji, Contoh\n")).toEqual([
      ["nim", "nama"],
      ["1", "Uji, Contoh"],
    ]);
  });

  it("keeps empty cells and empty rows in their place", () => {
    expect(rows("a,,c\n\n,\nd")).toEqual([
      ["a", "", "c"],
      [""],
      ["", ""],
      ["d"],
    ]);
  });

  it("finds the separator on the first line that is not empty", () => {
    expect(rows("\n  \nnim;nama\n1;Uji, Contoh\n")).toEqual([
      [""],
      ["  "],
      ["nim", "nama"],
      ["1", "Uji, Contoh"],
    ]);
  });

  it("leaves out the separators inside quotes when it finds the separator", () => {
    expect(rows('"a;b;c",d,e\n')).toEqual([["a;b;c", "d", "e"]]);
    expect(rows('"a,b,c";d;e\n')).toEqual([["a,b,c", "d", "e"]]);
  });

  it("reads a quote in the middle of a cell as an ordinary character", () => {
    expect(rows('1,Uji 5" Contoh,x\n2,Uji Dua,y\n')).toEqual([
      ["1", 'Uji 5" Contoh', "x"],
      ["2", "Uji Dua", "y"],
    ]);
  });

  it("opens a quoted cell after spaces, and leaves those spaces out", () => {
    expect(rows('a,  "b,c" ,d' + "\n" + '"e,f",g' + "\n")).toEqual([
      ["a", "b,c ", "d"],
      ["e,f", "g"],
    ]);
  });

  it("reads a quote after any other character as an ordinary character", () => {
    expect(rows('a,x "b,c"' + "\n" + 'd,"e"" f" "g"' + "\n")).toEqual([
      ["a", 'x "b', 'c"'],
      ["d", 'e" f "g"'],
    ]);
  });

  it("refuses a quoted cell that is never closed, with its row", () => {
    const text =
      "nim,nama" +
      "\n" +
      "1,Uji Satu" +
      "\n" +
      '2,"Uji Dua' +
      "\n" +
      "3,Uji Tiga" +
      "\n";

    expect(readCsv(text)).toEqual({
      ok: false,
      error:
        "Tanda kutip di baris 3 tidak ditutup. Perbaiki berkas, lalu unggah lagi.",
    });
  });

  it("counts a quoted cell over two lines as one row when it names the row", () => {
    const text = '1,"Uji' + "\n" + 'Satu"' + "\n" + '2,"Uji Dua';

    expect(readCsv(text)).toEqual({
      ok: false,
      error:
        "Tanda kutip di baris 2 tidak ditutup. Perbaiki berkas, lalu unggah lagi.",
    });
  });

  it("reads nothing from an empty text", () => {
    expect(rows("")).toEqual([]);
  });
});
