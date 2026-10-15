import { shortLine } from "@/files/csv-file";
import {
  type NumberedRow,
  readTitledRows,
  type TitledFile,
} from "@/files/titled-rows";
import type { Parsed } from "@/parsed";
import { SKPM_FILE_COLUMNS } from "./skpm-file-columns";
import {
  ACTIVITY_MAX_LENGTH,
  DAY_TEXT_MAX_LENGTH,
  LABEL_MAX_LENGTH,
  OTHER_CATEGORY,
  ROW_POINTS_MAX,
  ROW_POINTS_MIN,
} from "./skpm-ids";

export const UNKNOWN_NIM = "NIM tidak ada dalam data mahasiswa.";
export const NOT_ACTIVE = "Mahasiswa tidak aktif.";
export const NO_ACTIVITY = "Nama kegiatan kosong.";
export const POINTS_NOT_IN_RANGE = `Poin harus angka ${ROW_POINTS_MIN}–${ROW_POINTS_MAX}.`;

/** One row of an SKPM file: the text under each column. */
export interface SkpmCells {
  nim: string;
  kegiatan: string;
  kategori: string;
  tingkat: string;
  peran: string;
  tanggal: string;
  poin: string;
}

/** A filled row of an SKPM file. `row` is its number in the file, from 1. */
export interface SkpmLine {
  row: number;
  cells: SkpmCells;
}

/** What the server knows of a student a file names by NIM. */
export interface FileStudent {
  id: string;
  name: string;
  /** Whether the student is Aktif. */
  active: boolean;
}

/** A row that may be saved: one activity of one student. */
export interface ReadySkpmRow {
  row: number;
  studentId: string;
  nim: string;
  name: string;
  activity: string;
  category: string;
  level: string | null;
  activityRole: string | null;
  day: string | null;
  points: number;
}

export interface SkippedSkpmRow {
  row: number;
  /** The NIM as the file has it, cut short: it may be anything. */
  nim: string;
  reason: string;
}

export interface SkpmFileRows {
  ready: ReadySkpmRow[];
  skipped: SkippedSkpmRow[];
}

const SHOWN_NIM_LENGTH = 20;
const DIGITS = /^\d+$/;
/** A number of points: digits, with decimals after a point or a comma. */
const POINTS = /^\d{1,4}(?:[.,]\d+)?$/;

/** How an SKPM file is read: by its titles, or in the template's order. */
const SKPM_FILE: TitledFile = {
  columns: SKPM_FILE_COLUMNS,
  optional: [],
  startsRecord: (firstCell) => DIGITS.test(firstCell),
  noun: "kegiatan SKPM",
};

function refused(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

function cellsOf(row: NumberedRow): SkpmCells {
  function cell(templatePlace: number): string {
    return row.cells[templatePlace] ?? "";
  }
  return {
    nim: cell(0),
    kegiatan: cell(1),
    kategori: cell(2),
    tingkat: cell(3),
    peran: cell(4),
    tanggal: cell(5),
    poin: cell(6),
  };
}

/**
 * Reads an SKPM file into its filled rows. A first row that holds a
 * column title is followed, and must then name every column; without one
 * the columns are read in the order of the template.
 */
export function readSkpmFile(text: string): Parsed<SkpmLine[]> {
  const rows = readTitledRows(text, SKPM_FILE);
  if (!rows.ok) return rows;
  const lines = rows.value.map((row) => ({
    row: row.row,
    cells: cellsOf(row),
  }));
  return { ok: true, value: lines };
}

/** Each NIM the rows name, once, to look the students up by. */
export function fileNims(lines: readonly SkpmLine[]): string[] {
  const nims = lines.map((line) => line.cells.nim).filter((nim) => nim !== "");
  return [...new Set(nims)];
}

/** Points from 0 to 1000, kept to two decimals, as the prototype reads them. */
function pointsOf(text: string): number | null {
  if (!POINTS.test(text)) return null;
  const points = Number(text.replace(",", "."));
  if (points < ROW_POINTS_MIN || points > ROW_POINTS_MAX) return null;
  return Math.round(points * 100) / 100;
}

/** A text of the file on one line and no longer than is kept, or null when empty. */
function keptText(text: string, maxLength: number): string | null {
  const kept = shortLine(text, maxLength);
  return kept === "" ? null : kept;
}

function studentOf(
  nim: string,
  known: ReadonlyMap<string, FileStudent>,
): Parsed<FileStudent> {
  const student = known.get(nim);
  if (!student) return refused(UNKNOWN_NIM);
  if (!student.active) return refused(NOT_ACTIVE);
  return { ok: true, value: student };
}

/** Whether a row may be saved, and what it holds, or why it is skipped. */
function checkLine(
  line: SkpmLine,
  known: ReadonlyMap<string, FileStudent>,
): Parsed<ReadySkpmRow> {
  const { cells } = line;
  const student = studentOf(cells.nim, known);
  if (!student.ok) return student;
  const activity = keptText(cells.kegiatan, ACTIVITY_MAX_LENGTH);
  if (activity === null) return refused(NO_ACTIVITY);
  const points = pointsOf(cells.poin);
  if (points === null) return refused(POINTS_NOT_IN_RANGE);
  return {
    ok: true,
    value: {
      row: line.row,
      studentId: student.value.id,
      nim: cells.nim,
      name: student.value.name,
      activity,
      category: keptText(cells.kategori, LABEL_MAX_LENGTH) ?? OTHER_CATEGORY,
      level: keptText(cells.tingkat, LABEL_MAX_LENGTH),
      activityRole: keptText(cells.peran, LABEL_MAX_LENGTH),
      day: keptText(cells.tanggal, DAY_TEXT_MAX_LENGTH),
      points,
    },
  };
}

/**
 * Decides, row by row, ready or skipped and why. `known` holds the
 * students the file names, by NIM. A student may be in many rows: each is
 * an activity of its own, so every one is kept.
 */
export function skpmFileRows(
  lines: readonly SkpmLine[],
  known: ReadonlyMap<string, FileStudent>,
): SkpmFileRows {
  const ready: ReadySkpmRow[] = [];
  const skipped: SkippedSkpmRow[] = [];
  for (const line of lines) {
    const checked = checkLine(line, known);
    if (checked.ok) {
      ready.push(checked.value);
    } else {
      const nim = shortLine(line.cells.nim, SHOWN_NIM_LENGTH);
      skipped.push({ row: line.row, nim, reason: checked.error });
    }
  }
  return { ready, skipped };
}
