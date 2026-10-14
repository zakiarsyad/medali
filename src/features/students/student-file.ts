import { EMAIL_IN_USE } from "@/auth/account-email";
import {
  type NumberedRow,
  readTitledRows,
  type TitledFile,
} from "@/files/titled-rows";
import type { Parsed } from "@/parsed";
import { fileReason } from "./file-reasons";
import { isNim } from "./input-limits";
import {
  FILE_COLUMNS,
  type FileCells,
  OPTIONAL_COLUMNS,
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

const SHOWN_NIM_LENGTH = 20;
const REGISTERED = "NIM sudah terdaftar.";

/** How a student file is read: by its titles, or in the template's order. */
const STUDENT_FILE: TitledFile = {
  columns: FILE_COLUMNS,
  optional: OPTIONAL_COLUMNS,
  startsRecord: isNim,
  noun: "mahasiswa",
};

/** The cells of a row, which are in the order of the template. */
function cellsOf(row: NumberedRow): FileCells {
  function cell(templatePlace: number): string {
    return row.cells[templatePlace] ?? "";
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
    email: cell(13),
  };
}

/** Keeps the last row of each NIM, in the place of the first. */
function lastOfEachNim(rows: ReadyRow[]): ReadyRow[] {
  const byNim = new Map<string, ReadyRow>();
  for (const row of rows) byNim.set(row.student.nim, row);
  return [...byNim.values()];
}

function checkRows(rows: NumberedRow[], context: InputContext): FileRows {
  const ready: ReadyRow[] = [];
  const skipped: SkippedRow[] = [];
  for (const row of rows) {
    const cells = cellsOf(row);
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
  const rows = readTitledRows(text, STUDENT_FILE);
  if (!rows.ok) return rows;
  return { ok: true, value: checkRows(rows.value, context) };
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

/**
 * The ready rows whose address cannot be saved: one that an account
 * holds already (`inUse`), and one that an earlier row of the file
 * carries, so that the first row with an address keeps it.
 */
function rowsWithUsedEmail(
  ready: ReadyRow[],
  inUse: ReadonlySet<string>,
): Set<number> {
  const taken = new Set(inUse);
  const refusedRows = new Set<number>();
  const inFileOrder = [...ready].sort((a, b) => a.row - b.row);
  for (const { row, student } of inFileOrder) {
    if (student.email === null) continue;
    if (taken.has(student.email)) refusedRows.add(row);
    taken.add(student.email);
  }
  return refusedRows;
}

/**
 * Takes the ready rows whose address is already used out of the ready
 * ones, and puts them with the rows that break a rule: the file must be
 * corrected for them. A row with no address is never taken out.
 */
export function skipUsedEmails(
  rows: FileRows,
  inUse: ReadonlySet<string>,
): FileRows {
  const refusedRows = rowsWithUsedEmail(rows.ready, inUse);
  const taken = rows.ready.filter(({ row }) => refusedRows.has(row));
  const added = taken.map(({ row, student }) => ({
    row,
    nim: student.nim,
    reason: EMAIL_IN_USE,
  }));
  return {
    ...rows,
    ready: rows.ready.filter(({ row }) => !refusedRows.has(row)),
    skipped: [...rows.skipped, ...added].sort((a, b) => a.row - b.row),
  };
}
