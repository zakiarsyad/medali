import {
  SCORE_MAX,
  SCORE_MIN,
  type Scores,
} from "@/character-scores/assessment-score";
import { shortLine } from "@/files/csv-file";
import {
  type NumberedRow,
  readTitledRows,
  type TitledFile,
} from "@/files/titled-rows";
import type { Parsed } from "@/parsed";
import { MEDALI_VALUES } from "@/ui/medali-values";
import {
  ASSESSMENT_FILE_COLUMNS,
  valueColumnPlace,
} from "./assessment-file-columns";

export const UNKNOWN_NIM = "NIM tidak ada dalam data mahasiswa.";
export const NOT_ACTIVE = "Mahasiswa tidak aktif.";
export const SCORE_NOT_IN_RANGE = `Skor harus angka ${SCORE_MIN}–${SCORE_MAX}.`;

/** A filled row of an assessment file: its number in the file, from 1. */
export interface AssessmentLine {
  row: number;
  nim: string;
  /** The text under each value's column. */
  scores: Record<keyof Scores, string>;
}

/** What the server knows of a student a file names by NIM. */
export interface FileStudent {
  id: string;
  name: string;
  /** Whether the student is Aktif. */
  active: boolean;
}

/** A row that may be saved: the newest assessment of one student. */
export interface ReadyAssessmentRow {
  row: number;
  studentId: string;
  nim: string;
  name: string;
  scores: Scores;
}

export interface SkippedAssessmentRow {
  row: number;
  /** The NIM as the file has it, cut short: it may be anything. */
  nim: string;
  reason: string;
}

export interface AssessmentFileRows {
  /** One row per student: the last ready row the file has for them. */
  ready: ReadyAssessmentRow[];
  skipped: SkippedAssessmentRow[];
  /** How many ready rows were left out for a later row of the same NIM. */
  duplicates: number;
}

const SHOWN_NIM_LENGTH = 20;
const DIGITS = /^\d+$/;
/** Up to three digits, then a decimal part after a point or a comma. */
const SCORE = /^\d{1,3}(?:[.,]\d+)?$/;

/** How an assessment file is read: by its titles, or in the template's order. */
const ASSESSMENT_FILE: TitledFile = {
  columns: ASSESSMENT_FILE_COLUMNS,
  optional: [],
  startsRecord: (firstCell) => DIGITS.test(firstCell),
  noun: "mahasiswa",
};

function refused(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

function lineOf(row: NumberedRow): AssessmentLine {
  const scores = { M: "", E: "", D: "", A: "", L: "", I: "" };
  for (const { key } of MEDALI_VALUES) {
    scores[key] = row.cells[valueColumnPlace(key)] ?? "";
  }
  return { row: row.row, nim: row.cells[0] ?? "", scores };
}

/**
 * Reads an assessment file into its filled rows. A first row that holds
 * a column title is followed, and must then name all seven columns;
 * without one the columns are read in the order of the template.
 */
export function readAssessmentFile(text: string): Parsed<AssessmentLine[]> {
  const rows = readTitledRows(text, ASSESSMENT_FILE);
  if (!rows.ok) return rows;
  return { ok: true, value: rows.value.map(lineOf) };
}

/** Each NIM the rows name, once, to look the students up by. */
export function fileNims(lines: readonly AssessmentLine[]): string[] {
  const nims = lines.map((line) => line.nim).filter((nim) => nim !== "");
  return [...new Set(nims)];
}

/**
 * A score as the file writes it, rounded to a whole number, half up:
 * 79.5 and 79,5 become 80. As in the prototype, the range is checked
 * before rounding, so 39.5 is refused.
 */
export function scoreOf(text: string): number | null {
  if (!SCORE.test(text)) return null;
  const score = Number(text.replace(",", "."));
  if (score < SCORE_MIN || score > SCORE_MAX) return null;
  return Math.round(score);
}

function scoresOf(line: AssessmentLine): Scores | null {
  const scores: Scores = { M: 0, E: 0, D: 0, A: 0, L: 0, I: 0 };
  for (const { key } of MEDALI_VALUES) {
    const score = scoreOf(line.scores[key]);
    if (score === null) return null;
    scores[key] = score;
  }
  return scores;
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
  line: AssessmentLine,
  known: ReadonlyMap<string, FileStudent>,
): Parsed<ReadyAssessmentRow> {
  const student = studentOf(line.nim, known);
  if (!student.ok) return student;
  const scores = scoresOf(line);
  if (scores === null) return refused(SCORE_NOT_IN_RANGE);
  return {
    ok: true,
    value: {
      row: line.row,
      studentId: student.value.id,
      nim: line.nim,
      name: student.value.name,
      scores,
    },
  };
}

/**
 * Decides, row by row, ready or skipped and why. `known` holds the
 * students the file names, by NIM. A student in several ready rows gets
 * the last one, as in the prototype; the others count as duplicates.
 */
export function assessmentFileRows(
  lines: readonly AssessmentLine[],
  known: ReadonlyMap<string, FileStudent>,
): AssessmentFileRows {
  const byNim = new Map<string, ReadyAssessmentRow>();
  const skipped: SkippedAssessmentRow[] = [];
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
