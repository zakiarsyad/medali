import { describe, expect, it } from "vitest";
import { readCsv } from "./csv-text";

describe("readCsv", () => {
  it("reads rows of cells, with or without a last line break", () => {
    expect(readCsv("a,b\nc,d")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
    expect(readCsv("a,b\nc,d\n")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("reads Windows and old Mac line breaks", () => {
    expect(readCsv("a,b\r\nc,d\re,f")).toEqual([
      ["a", "b"],
      ["c", "d"],
      ["e", "f"],
    ]);
  });

  it("reads a quoted cell with a comma, a line break and a doubled quote", () => {
    expect(
      readCsv('1,"Uji, Contoh","baris\nkedua","kata ""kutip"""\n'),
    ).toEqual([["1", "Uji, Contoh", "baris\nkedua", 'kata "kutip"']]);
  });

  it("leaves out the byte-order mark a spreadsheet puts first", () => {
    expect(readCsv("\uFEFFnim,nama\n")).toEqual([["nim", "nama"]]);
  });

  it("reads semicolons when the first line has more of them than commas", () => {
    expect(readCsv("nim;nama\n1;Uji, Contoh\n")).toEqual([
      ["nim", "nama"],
      ["1", "Uji, Contoh"],
    ]);
  });

  it("keeps empty cells and empty rows in their place", () => {
    expect(readCsv("a,,c\n\n,\nd")).toEqual([
      ["a", "", "c"],
      [""],
      ["", ""],
      ["d"],
    ]);
  });

  it("finds the separator on the first line that is not empty", () => {
    expect(readCsv("\n  \nnim;nama\n1;Uji, Contoh\n")).toEqual([
      [""],
      ["  "],
      ["nim", "nama"],
      ["1", "Uji, Contoh"],
    ]);
  });

  it("leaves out the separators inside quotes when it finds the separator", () => {
    expect(readCsv('"a;b;c",d,e\n')).toEqual([["a;b;c", "d", "e"]]);
    expect(readCsv('"a,b,c";d;e\n')).toEqual([["a,b,c", "d", "e"]]);
  });

  it("reads a quote in the middle of a cell as an ordinary character", () => {
    expect(readCsv('1,Uji 5" Contoh,x\n2,Uji Dua,y\n')).toEqual([
      ["1", 'Uji 5" Contoh', "x"],
      ["2", "Uji Dua", "y"],
    ]);
  });

  it("opens a quoted cell only when the quote is its first character", () => {
    expect(readCsv('a, "b,c"\n"d,e",f\n')).toEqual([
      ["a", ' "b', 'c"'],
      ["d,e", "f"],
    ]);
  });

  it("reads nothing from an empty text", () => {
    expect(readCsv("")).toEqual([]);
  });
});
