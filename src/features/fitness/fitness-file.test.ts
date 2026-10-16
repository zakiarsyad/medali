import { describe, expect, it } from "vitest";
import { MAX_FILE_ROWS } from "@/files/csv-file";
import {
  type FileStudent,
  type FitnessFileRows,
  fileNims,
  fitnessFileRows,
  NOT_ACTIVE,
  readFitnessFile,
  SCORE_NOT_IN_RANGE,
  UNKNOWN_NIM,
} from "./fitness-file";
import { fitnessTemplateCsv } from "./fitness-file-columns";

const TITLES = "nim,skor";

const STUDENTS = new Map<string, FileStudent>([
  ["4121230001", { id: "a", name: "Ani", active: true }],
  ["4121230002", { id: "b", name: "Budi", active: true }],
  ["4121230003", { id: "c", name: "Cuti", active: false }],
  ["4121239999", { id: "t", name: "Templat", active: true }],
]);

function read(...lines: string[]): FitnessFileRows {
  const result = readFitnessFile(lines.join("\n"));
  if (!result.ok) throw new Error(result.error);
  return fitnessFileRows(result.value, STUDENTS);
}

function reasonFor(line: string): string | undefined {
  return read(TITLES, line).skipped[0]?.reason;
}

describe("readFitnessFile and fitnessFileRows", () => {
  it("reads the template: its example row is ready", () => {
    const result = readFitnessFile(fitnessTemplateCsv());
    if (!result.ok) throw new Error(result.error);

    expect(fitnessFileRows(result.value, STUDENTS)).toEqual({
      ready: [
        {
          row: 2,
          studentId: "t",
          nim: "4121239999",
          name: "Templat",
          score: 82,
        },
      ],
      skipped: [],
      duplicates: 0,
    });
  });

  it("reads the columns by their titles, in any order and case, and the prototype's other titles of skor", () => {
    expect(read("SKOR,Nim", "88,4121230001").ready[0]?.score).toBe(88);
    expect(read("nim,nilai", "4121230001,70").ready[0]?.score).toBe(70);
    expect(read("skor_kebugaran,nim", "54,4121230001").ready[0]?.score).toBe(
      54,
    );
  });

  it("reads a file without titles in the order of the template", () => {
    expect(read("4121230001,0").ready).toEqual([
      { row: 1, studentId: "a", nim: "4121230001", name: "Ani", score: 0 },
    ]);
  });

  it("refuses a file that lacks a column, saying which", () => {
    expect(readFitnessFile("nim,catatan\n4121230001,baik")).toEqual({
      ok: false,
      error: "Kolom tidak ditemukan: skor. Samakan judul kolom dengan templat.",
    });
  });

  it("refuses an empty file and one with too many rows", () => {
    expect(readFitnessFile(`${TITLES}\n`)).toEqual({
      ok: false,
      error:
        "Berkas tidak berisi baris mahasiswa. Isi berkas sesuai templat, lalu unggah lagi.",
    });
    const many = Array.from(
      { length: MAX_FILE_ROWS + 1 },
      () => "4121230001,80",
    );
    expect(readFitnessFile([TITLES, ...many].join("\n"))).toEqual({
      ok: false,
      error:
        "Berkas berisi 1.001 baris mahasiswa, paling banyak 1.000. Bagi menjadi beberapa berkas, lalu unggah satu per satu.",
    });
  });

  it("reads a file of 1,000 rows", () => {
    const many = Array.from({ length: MAX_FILE_ROWS }, () => "4121230001,80");

    expect(read(TITLES, ...many).ready).toHaveLength(1);
  });

  it("skips a NIM that is not in the data, and a student who is not Aktif", () => {
    expect(reasonFor("4121230099,80")).toBe(UNKNOWN_NIM);
    expect(reasonFor(",80")).toBe(UNKNOWN_NIM);
    expect(reasonFor("4121230003,80")).toBe(NOT_ACTIVE);
  });

  it.each([
    ["above 100", "4121230001,101"],
    ["negative", "4121230001,-1"],
    ["empty", "4121230001,"],
    ["a word", "4121230001,baik"],
    ["with a decimal point", "4121230001,79.5"],
    ["with a decimal comma", '4121230001,"79,5"'],
    ["a whole number written with a decimal", "4121230001,80.0"],
  ])("skips a row with a score %s, as the form refuses it", (_, line) => {
    expect(reasonFor(line)).toBe(SCORE_NOT_IN_RANGE);
  });

  it("keeps the edges of the range", () => {
    expect(read(TITLES, "4121230001,0", "4121230002,100").ready).toHaveLength(
      2,
    );
  });

  it("says the prototype's reasons, numbering each skipped row as in the file", () => {
    const rows = read(
      TITLES,
      "4121230001,80",
      "",
      "4121230099,80",
      "4121230002,120",
      "4121230003,80",
    );

    expect(rows.skipped).toEqual([
      {
        row: 4,
        nim: "4121230099",
        reason: "NIM tidak ada dalam data mahasiswa.",
      },
      { row: 5, nim: "4121230002", reason: "Skor harus angka 0–100." },
      { row: 6, nim: "4121230003", reason: "Mahasiswa tidak aktif." },
    ]);
  });

  it("uses the last ready row of a student in the file twice, and counts the others", () => {
    const rows = read(
      TITLES,
      "4121230001,60",
      "4121230002,75",
      "4121230001,90",
      "4121230001,900",
    );

    expect(rows.ready.map((row) => [row.nim, row.row, row.score])).toEqual([
      ["4121230001", 4, 90],
      ["4121230002", 3, 75],
    ]);
    expect(rows.duplicates).toBe(1);
    expect(rows.skipped).toHaveLength(1);
  });
});

describe("fileNims", () => {
  it("gives each NIM once, without the empty ones", () => {
    const result = readFitnessFile(
      [TITLES, "4121230001,80", ",80", "4121230001,70"].join("\n"),
    );
    if (!result.ok) throw new Error(result.error);

    expect(fileNims(result.value)).toEqual(["4121230001"]);
  });
});

describe("fitnessTemplateCsv", () => {
  it("holds the column titles and one made-up student", () => {
    expect(fitnessTemplateCsv().split("\n")).toEqual([
      "nim,skor",
      "4121239999,82",
      "",
    ]);
  });
});
