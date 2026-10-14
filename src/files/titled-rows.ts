import type { Parsed } from "@/parsed";
import { MAX_FILE_ROWS } from "./csv-file";
import { readCsv } from "./csv-text";

/**
 * A column of an uploaded list. `others` are the titles a file may use
 * instead of `title`.
 */
export interface FileColumnRule {
  title: string;
  others: readonly string[];
}

/** What a list of titled columns is and how its rows are named. */
export interface TitledFile {
  /** The columns in the order of the template. */
  columns: readonly FileColumnRule[];
  /** The titles of the columns a file may leave out altogether. */
  optional: readonly string[];
  /** Whether a first cell is a record, so the row names no columns. */
  startsRecord: (firstCell: string) => boolean;
  /** What one row holds, as the messages name it, such as "mahasiswa". */
  noun: string;
}

/**
 * One filled row of a file. `row` is its number in the file, from 1;
 * `cells` are its texts, trimmed, in the order of the template.
 */
export interface NumberedRow {
  row: number;
  cells: string[];
}

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

function titlesOf(row: NumberedRow): string[] {
  return row.cells.map((cell) => cell.trim().toLowerCase());
}

function acceptedTitles(column: FileColumnRule): string[] {
  return [column.title, ...column.others];
}

/**
 * Whether a first row names the columns. A row that starts with a record
 * is one, even when one of its cells is a word that is also a title.
 */
function namesColumns(titles: string[], file: TitledFile): boolean {
  if (file.startsRecord(titles[0] ?? "")) return false;
  const known = file.columns.flatMap(acceptedTitles);
  return titles.some((title) => known.includes(title));
}

/**
 * Where each column of the template is in a file whose first row names
 * its columns, -1 for an optional one the file leaves out.
 */
function placesByTitle(titles: string[], file: TitledFile): Parsed<number[]> {
  const places = file.columns.map((column) => {
    const accepted = acceptedTitles(column);
    return titles.findIndex((title) => accepted.includes(title));
  });
  const missing = file.columns.filter(
    (column, index) =>
      places[index] === -1 && !file.optional.includes(column.title),
  );
  if (missing.length > 0) {
    const names = missing.map((column) => column.title).join(", ");
    return refused(
      `Kolom tidak ditemukan: ${names}. Samakan judul kolom dengan templat.`,
    );
  }
  return { ok: true, value: places };
}

/** The cells of a row in the order of the template, empty where none is. */
function inTemplateOrder(row: NumberedRow, places: number[]): NumberedRow {
  const cells = places.map((place) => (row.cells[place] ?? "").trim());
  return { row: row.row, cells };
}

/**
 * Reads an uploaded list of titled columns into its filled rows. A first
 * row that holds a column title is followed, and must then name every
 * column but the optional ones; without one the columns are read in the
 * order of the template. Refused, with what to do, for a quote that is
 * never closed, a file with no row, and one with too many rows.
 */
export function readTitledRows(
  text: string,
  file: TitledFile,
): Parsed<NumberedRow[]> {
  const empty = `Berkas tidak berisi baris ${file.noun}. Isi berkas sesuai templat, lalu unggah lagi.`;
  const read = readCsv(text);
  if (!read.ok) return read;
  const rows = filled(read.value);
  const [first, ...rest] = rows;
  if (!first) return refused(empty);

  const titles = titlesOf(first);
  const hasTitles = namesColumns(titles, file);
  const templateOrder = file.columns.map((_, index) => index);
  const places: Parsed<number[]> = hasTitles
    ? placesByTitle(titles, file)
    : { ok: true, value: templateOrder };
  if (!places.ok) return places;

  const records = hasTitles ? rest : rows;
  if (records.length === 0) return refused(empty);
  if (records.length > MAX_FILE_ROWS) {
    return refused(
      `Berkas berisi ${shown(records.length)} baris ${file.noun}, paling banyak ${shown(MAX_FILE_ROWS)}. Bagi menjadi beberapa berkas, lalu unggah satu per satu.`,
    );
  }
  const ordered = records.map((row) => inTemplateOrder(row, places.value));
  return { ok: true, value: ordered };
}
