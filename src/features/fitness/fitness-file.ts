import { shortLine } from "@/files/csv-file";
import {
  type NumberedRow,
  readTitledRows,
  type TitledFile,
} from "@/files/titled-rows";
import type { Parsed } from "@/parsed";
import { FITNESS_FILE_COLUMNS } from "./fitness-file-columns";
import { SCORE_MAX, SCORE_MIN } from "./fitness-ids";
import { scoreOf } from "./fitness-input";

export const UNKNOWN_NIM = "NIM tidak ada dalam data mahasiswa.";
export const NOT_ACTIVE = "Mahasiswa tidak aktif.";
export const SCORE_NOT_IN_RANGE = `Skor harus angka ${SCORE_MIN}–${SCORE_MAX}.`;

/** A filled row of a fitness file: its number in the file, from 1. */
export interface FitnessLine {
  row: number;
  nim: string;
  /** The text under skor. */
  score: string;
}

/** What the server knows of a student a file names by NIM. */
export interface FileStudent {
  id: string;
  name: string;
  /** Whether the student is Aktif. */
  active: boolean;
}

/** A row that may be saved: the latest test of one student. */
export interface ReadyFitnessRow {
  row: number;
  studentId: string;
  nim: string;
  name: string;
  score: number;
}

export interface SkippedFitnessRow {
  row: number;
  /** The NIM as the file has it, cut short: it may be anything. */
  nim: string;
  reason: string;
}

export interface FitnessFileRows {
  /** One row per student: the last ready row the file has for them. */
  ready: ReadyFitnessRow[];
  skipped: SkippedFitnessRow[];
  /** How many ready rows were left out for a later row of the same NIM. */
  duplicates: number;
}

const SHOWN_NIM_LENGTH = 20;
const DIGITS = /^\d+$/;

/** How a fitness file is read: by its titles, or in the template's order. */
const FITNESS_FILE: TitledFile = {
  columns: FITNESS_FILE_COLUMNS,
  optional: [],
  startsRecord: (firstCell) => DIGITS.test(firstCell),
  noun: "mahasiswa",
};

function refused(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

function lineOf(row: NumberedRow): FitnessLine {
  return { row: row.row, nim: row.cells[0] ?? "", score: row.cells[1] ?? "" };
}

/**
 * Reads a fitness file into its filled rows. A first row that holds a
 * column title is followed, and must then name both columns; without
 * one the columns are read in the order of the template.
 */
export function readFitnessFile(text: string): Parsed<FitnessLine[]> {
  const rows = readTitledRows(text, FITNESS_FILE);
  if (!rows.ok) return rows;
  return { ok: true, value: rows.value.map(lineOf) };
}

/** Each NIM the rows name, once, to look the students up by. */
export function fileNims(lines: readonly FitnessLine[]): string[] {
  const nims = lines.map((line) => line.nim).filter((nim) => nim !== "");
  return [...new Set(nims)];
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

/**
 * Whether a row may be saved, and what it holds, or why it is skipped.
 * The score follows the group form's rule: a whole number from 0 to 100,
 * so one with a decimal is skipped rather than rounded.
 */
function checkLine(
  line: FitnessLine,
  known: ReadonlyMap<string, FileStudent>,
): Parsed<ReadyFitnessRow> {
  const student = studentOf(line.nim, known);
  if (!student.ok) return student;
  const score = scoreOf(line.score);
  if (score === null) return refused(SCORE_NOT_IN_RANGE);
  return {
    ok: true,
    value: {
      row: line.row,
      studentId: student.value.id,
      nim: line.nim,
      name: student.value.name,
      score,
    },
  };
}

/**
 * Decides, row by row, ready or skipped and why. `known` holds the
 * students the file names, by NIM. A student in several ready rows gets
 * the last one, as in the prototype; the others count as duplicates.
 */
export function fitnessFileRows(
  lines: readonly FitnessLine[],
  known: ReadonlyMap<string, FileStudent>,
): FitnessFileRows {
  const byNim = new Map<string, ReadyFitnessRow>();
  const skipped: SkippedFitnessRow[] = [];
  let readyRows = 0;
  for (const line of lines) {
    const checked = checkLine(line, known);
    if (checked.ok) {
      readyRows++;
      byNim.set(checked.value.nim, checked.value);
    } else {
      const nim = shortLine(line.nim, SHOWN_NIM_LENGTH);
      skipped.push({ row: line.row, nim, reason: checked.error });
    }
  }
  const ready = [...byNim.values()];
  return { ready, skipped, duplicates: readyRows - ready.length };
}
