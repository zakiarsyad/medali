import type { Parsed } from "@/parsed";
import { readCsv } from "./csv-text";
import { fileReason } from "./file-reasons";
import { isNim } from "./input-limits";
import {
  FILE_COLUMNS,
  type FileCells,
  MAX_FILE_ROWS,
} from "./student-file-columns";
import {
  type InputContext,
  parseStudent,
  type StudentInput,
} from "./student-input";
import { rowFields } from "./student-row";

/** A row that may be saved. `row` is its number in the file, from 1. */
export interface ReadyRow {
  row: number;
  student: StudentInput;
}

export interface SkippedRow {
  row: number;
  /** The NIM as the file has it, cut short: it may be anything. */
  nim: string;
  reason: string;
}

export interface FileRows {
  ready: ReadyRow[];
  /** Rows that break a rule: the file must be corrected for these. */
  skipped: SkippedRow[];
  /** Rows that are in order, but whose NIM a student already has. */
  registered: SkippedRow[];
  /** Rows left out because a later row has the same NIM. */
  repeated: number;
}

interface NumberedRow {
  row: number;
  cells: string[];
}

const SHOWN_NIM_LENGTH = 20;
const REGISTERED = "NIM sudah terdaftar.";
const EMPTY_FILE =
  "Berkas tidak berisi baris mahasiswa. Isi berkas sesuai templat, lalu unggah lagi.";
const TEMPLATE_ORDER = FILE_COLUMNS.map((_, index) => index);
const KNOWN_TITLES: string[] = FILE_COLUMNS.flatMap((column) => [
  column.title,
  ...column.others,
]);

function refused(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

function shown(amount: number): string {
  return amount.toLocaleString("id-ID");
}

function filled(rows: string[][]): NumberedRow[] {
  const numbered = rows.map((cells, index) => ({ row: index + 1, cells }));
  return numbered.filter(({ cells }) => cells.some((cell) => cell.trim()));
}

/**
 * Whether a first row names the columns. A row that starts with a NIM is
 * a student, even when one of its cells is a word that is also a title.
 */
function namesColumns(titles: string[]): boolean {
  if (isNim(titles[0] ?? "")) return false;
  return titles.some((title) => KNOWN_TITLES.includes(title));
}

function titlesOf(row: NumberedRow): string[] {
  return row.cells.map((cell) => cell.trim().toLowerCase());
}

/**
 * Where each column of the template is in a file whose first row names
 * its columns.
 */
function placesByTitle(titles: string[]): Parsed<number[]> {
  const places = FILE_COLUMNS.map((column) => {
    const accepted: string[] = [column.title, ...column.others];
    return titles.findIndex((title) => accepted.includes(title));
  });
  const missing = FILE_COLUMNS.filter((_, index) => places[index] === -1);
  if (missing.length > 0) {
    const names = missing.map((column) => column.title).join(", ");
    return refused(
      `Kolom tidak ditemukan: ${names}. Samakan judul kolom dengan templat.`,
    );
  }
  return { ok: true, value: places };
}

/** `places` holds, in the order of the template, where each column is. */
function cellsOf(row: NumberedRow, places: number[]): FileCells {
  function cell(templatePlace: number): string {
    const place = places[templatePlace] ?? -1;
    return (row.cells[place] ?? "").trim();
  }
  return {
    nim: cell(0),
    nama: cell(1),
    prodi: cell(2),
    jalur: cell(3),
    jenis_kelamin: cell(4),
    angkatan: cell(5),
    kelas: cell(6),
    provinsi: cell(7),
    instansi_asal: cell(8),
    afirmasi: cell(9),
    pembibitan: cell(10),
    internasional: cell(11),
    status: cell(12),
  };
}

/** Keeps the last row of each NIM, in the place of the first. */
function lastOfEachNim(rows: ReadyRow[]): ReadyRow[] {
  const byNim = new Map<string, ReadyRow>();
  for (const row of rows) byNim.set(row.student.nim, row);
  return [...byNim.values()];
}

function checkRows(
  rows: NumberedRow[],
  places: number[],
  context: InputContext,
): FileRows {
  const ready: ReadyRow[] = [];
  const skipped: SkippedRow[] = [];
  for (const row of rows) {
    const cells = cellsOf(row, places);
    const parsed = parseStudent(rowFields(cells, context.programs), context);
    if (parsed.ok) {
      ready.push({ row: row.row, student: parsed.value });
    } else {
      const nim = cells.nim.slice(0, SHOWN_NIM_LENGTH);
      const reason = fileReason(parsed.error, cells, context);
      skipped.push({ row: row.row, nim, reason });
    }
  }
  const unique = lastOfEachNim(ready);
  return {
    ready: unique,
    skipped,
    registered: [],
    repeated: ready.length - unique.length,
  };
}

/**
 * Reads a student file and decides, row by row, ready or skipped and why,
 * by the rules of the form. A first row that holds a column title is
 * followed, and must then name every column; without one the columns are
 * read in the order of the template. Whether a NIM is already registered
 * is not known here: `skipRegistered` adds that.
 */
export function readStudentFile(
  text: string,
  context: InputContext,
): Parsed<FileRows> {
  const read = readCsv(text);
  if (!read.ok) return read;
  const rows = filled(read.value);
  const [first, ...rest] = rows;
  if (!first) return refused(EMPTY_FILE);

  const titles = titlesOf(first);
  const hasTitles = namesColumns(titles);
  const places: Parsed<number[]> = hasTitles
    ? placesByTitle(titles)
    : { ok: true, value: TEMPLATE_ORDER };
  if (!places.ok) return places;

  const studentRows = hasTitles ? rest : rows;
  if (studentRows.length === 0) return refused(EMPTY_FILE);
  if (studentRows.length > MAX_FILE_ROWS) {
    return refused(
      `Berkas berisi ${shown(studentRows.length)} baris mahasiswa, paling banyak ${shown(MAX_FILE_ROWS)}. Bagi menjadi beberapa berkas, lalu unggah satu per satu.`,
    );
  }
  return { ok: true, value: checkRows(studentRows, places.value, context) };
}

/**
 * Takes the ready rows whose NIM is already registered out of the ready
 * ones, and keeps them apart from the rows that break a rule.
 */
export function skipRegistered(
  rows: FileRows,
  registered: ReadonlySet<string>,
): FileRows {
  const taken = rows.ready.filter((row) => registered.has(row.student.nim));
  const added = taken.map(({ row, student }) => ({
    row,
    nim: student.nim,
    reason: REGISTERED,
  }));
  return {
    ...rows,
    ready: rows.ready.filter((row) => !registered.has(row.student.nim)),
    registered: [...rows.registered, ...added].sort((a, b) => a.row - b.row),
  };
}
