import { describe, expect, it } from "vitest";
import { MAX_FILE_ROWS } from "@/files/csv-file";
import {
  type AssessmentFileRows,
  assessmentFileRows,
  type FileStudent,
  fileNims,
  NOT_ACTIVE,
  readAssessmentFile,
  SCORE_NOT_IN_RANGE,
  scoreOf,
  UNKNOWN_NIM,
} from "./assessment-file";
import { assessmentTemplateCsv } from "./assessment-file-columns";

const TITLES = "nim,mandiri,empati,disiplin,adaptif,loyal,integritas";

const STUDENTS = new Map<string, FileStudent>([
  ["4121230001", { id: "a", name: "Ani", active: true }],
  ["4121230002", { id: "b", name: "Budi", active: true }],
  ["4121230003", { id: "c", name: "Cuti", active: false }],
  ["4121239999", { id: "t", name: "Templat", active: true }],
]);

const SILVER = { M: 80, E: 78, D: 84, A: 72, L: 82, I: 86 };

function read(...lines: string[]): AssessmentFileRows {
  const result = readAssessmentFile(lines.join("\n"));
  if (!result.ok) throw new Error(result.error);
  return assessmentFileRows(result.value, STUDENTS);
}

function reasonFor(line: string): string | undefined {
  return read(TITLES, line).skipped[0]?.reason;
}

describe("readAssessmentFile and assessmentFileRows", () => {
  it("reads the template: its example row is ready", () => {
    const result = readAssessmentFile(assessmentTemplateCsv());
    if (!result.ok) throw new Error(result.error);

    expect(assessmentFileRows(result.value, STUDENTS)).toEqual({
      ready: [
        {
          row: 2,
          studentId: "t",
          nim: "4121239999",
          name: "Templat",
          scores: SILVER,
        },
      ],
      skipped: [],
      duplicates: 0,
    });
  });

  it("reads the columns by their titles, in any order and case", () => {
    const rows = read(
      "Integritas,LOYAL,adaptif,disiplin,empati,mandiri,nim",
      "86,82,72,84,78,80,4121230001",
    );

    expect(rows.ready[0]?.scores).toEqual(SILVER);
  });

  it("reads a file without titles in the order of the template", () => {
    const rows = read("4121230001,80,78,84,72,82,86");

    expect(rows.ready).toEqual([
      {
        row: 1,
        studentId: "a",
        nim: "4121230001",
        name: "Ani",
        scores: SILVER,
      },
    ]);
  });

  it("refuses a file that lacks a column, saying which", () => {
    const result = readAssessmentFile(
      "nim,mandiri,empati,disiplin,adaptif,loyal\n4121230001,80,78,84,72,82",
    );

    expect(result).toEqual({
      ok: false,
      error:
        "Kolom tidak ditemukan: integritas. Samakan judul kolom dengan templat.",
    });
  });

  it("refuses an empty file and one with too many rows", () => {
    expect(readAssessmentFile(`${TITLES}\n`)).toEqual({
      ok: false,
      error:
        "Berkas tidak berisi baris mahasiswa. Isi berkas sesuai templat, lalu unggah lagi.",
    });
    const many = Array.from(
      { length: MAX_FILE_ROWS + 1 },
      () => "4121230001,80,80,80,80,80,80",
    );
    expect(readAssessmentFile([TITLES, ...many].join("\n"))).toEqual({
      ok: false,
      error:
        "Berkas berisi 1.001 baris mahasiswa, paling banyak 1.000. Bagi menjadi beberapa berkas, lalu unggah satu per satu.",
    });
  });

  it("skips a NIM that is not in the data, and a student who is not Aktif", () => {
    expect(reasonFor("4121230099,80,78,84,72,82,86")).toBe(UNKNOWN_NIM);
    expect(reasonFor(",80,78,84,72,82,86")).toBe(UNKNOWN_NIM);
    expect(reasonFor("4121230003,80,78,84,72,82,86")).toBe(NOT_ACTIVE);
  });

  it.each([
    ["below 40", "4121230001,39,78,84,72,82,86"],
    ["above 100", "4121230001,80,78,84,72,82,101"],
    ["empty", "4121230001,80,,84,72,82,86"],
    ["a word", "4121230001,80,78,baik,72,82,86"],
    ["negative", "4121230001,80,78,84,-72,82,86"],
  ])("skips a row with a score %s", (_, line) => {
    expect(reasonFor(line)).toBe(SCORE_NOT_IN_RANGE);
  });

  it("says the prototype's reasons, numbering each skipped row as in the file", () => {
    const rows = read(
      TITLES,
      "4121230001,80,78,84,72,82,86",
      "",
      "4121230099,80,78,84,72,82,86",
      "4121230002,80,78,84,72,82,30",
    );

    expect(rows.skipped).toEqual([
      {
        row: 4,
        nim: "4121230099",
        reason: "NIM tidak ada dalam data mahasiswa.",
      },
      { row: 5, nim: "4121230002", reason: "Skor harus angka 40–100." },
    ]);
  });

  it("uses the last ready row of a student in the file twice, and counts the others", () => {
    const rows = read(
      TITLES,
      "4121230001,60,60,60,60,60,60",
      "4121230002,80,78,84,72,82,86",
      "4121230001,80,78,84,72,82,86",
      "4121230001,80,78,84,72,82,10",
    );

    expect(rows.ready.map((row) => [row.nim, row.row])).toEqual([
      ["4121230001", 4],
      ["4121230002", 3],
    ]);
    expect(rows.ready[0]?.scores).toEqual(SILVER);
    expect(rows.duplicates).toBe(1);
    expect(rows.skipped).toHaveLength(1);
  });
});

describe("scoreOf", () => {
  it.each([
    ["80", 80],
    ["40", 40],
    ["100", 100],
    ["79.5", 80],
    ["79,5", 80],
    ["79.4", 79],
    ["99.5", 100],
    ["40.0", 40],
  ])("reads %s as %i", (text, score) => {
    expect(scoreOf(text)).toBe(score);
  });

  it.each(["39.5", "100.5", "", "1e2", "0x50", ".5", "80.", "8 0"])(
    "refuses %s",
    (text) => {
      expect(scoreOf(text)).toBeNull();
    },
  );
});

describe("fileNims", () => {
  it("gives each NIM once, without the empty ones", () => {
    const result = readAssessmentFile(
      [
        TITLES,
        "4121230001,80,80,80,80,80,80",
        ",80,80,80,80,80,80",
        "4121230001,70,70,70,70,70,70",
      ].join("\n"),
    );
    if (!result.ok) throw new Error(result.error);

    expect(fileNims(result.value)).toEqual(["4121230001"]);
  });
});
