import { shortLine } from "@/files/csv-file";
import {
  type NumberedRow,
  readTitledRows,
  type TitledFile,
} from "@/files/titled-rows";
import type { Parsed } from "@/parsed";
import { BASIS_TOO_LONG, NOTE_TOO_LONG } from "./entry-input";
import { SIKU_FILE_COLUMNS, SIKU_OPTIONAL_COLUMNS } from "./siku-file-columns";
import {
  BASIS_MAX_LENGTH,
  ENTRY_NOTE_MAX_LENGTH,
  POINTS_MAX,
  POINTS_MIN,
  REASON_WITH_BASIS,
  reasonsOf,
  type SikuKind,
  type SikuReason,
} from "./siku-ids";
import { REASON_WORDS } from "./siku-words";

export const UNKNOWN_NIM = "NIM tidak ada dalam data mahasiswa.";
export const NOT_ACTIVE = "Mahasiswa tidak aktif.";
export const NOT_VISIBLE = "Di luar mahasiswa yang dapat Anda kelola.";
export const UNKNOWN_KIND = "Jenis harus tambah atau kurang.";
export const UNKNOWN_REASON = "Alasan tidak dikenali.";
export const POINTS_NOT_IN_RANGE = `Poin harus ${POINTS_MIN}–${POINTS_MAX}.`;
export const NEEDS_DIRECTOR_NOTE =
  "Ketentuan keputusan Direktur wajib disertai keterangan atau nomor surat.";

/** One row of a SIKU file: the text under each column. */
export interface SikuCells {
  nim: string;
  jenis: string;
  alasan: string;
  poin: string;
  keterangan: string;
}

/** A filled row of a SIKU file. `row` is its number in the file, from 1. */
export interface SikuLine {
  row: number;
  cells: SikuCells;
}

/** What the server knows of a student a file names by NIM. */
export interface FileStudent {
  id: string;
  name: string;
  /** Whether the student is Aktif. */
  active: boolean;
  /** Whether the account may see the student. */
  visible: boolean;
}

/** A row that may be saved: one gain or loss for one student. */
export interface ReadySikuRow {
  row: number;
  studentId: string;
  nim: string;
  name: string;
  kind: SikuKind;
  reason: SikuReason;
  points: number;
  /** Keterangan; empty for a decision of the Direktur. */
  note: string;
  /** Dasar; empty for every reason but a decision of the Direktur. */
  basis: string;
}

export interface SkippedSikuRow {
  row: number;
  /** The NIM as the file has it, cut short: it may be anything. */
  nim: string;
  reason: string;
}

export interface SikuFileRows {
  ready: ReadySikuRow[];
  skipped: SkippedSikuRow[];
}

const SHOWN_NIM_LENGTH = 20;
const GAIN_WORDS = ["tambah", "penambahan", "+"];
const LOSS_WORDS = ["kurang", "pengurangan", "-", "−"];
const WHOLE = /^\d{1,3}$/;
const DIGITS = /^\d+$/;

/** How a SIKU file is read: by its titles, or in the template's order. */
const SIKU_FILE: TitledFile = {
  columns: SIKU_FILE_COLUMNS,
  optional: SIKU_OPTIONAL_COLUMNS,
  startsRecord: (firstCell) => DIGITS.test(firstCell),
  noun: "penyesuaian SIKU",
};

function refused(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

function cellsOf(row: NumberedRow): SikuCells {
  function cell(templatePlace: number): string {
    return row.cells[templatePlace] ?? "";
  }
  return {
    nim: cell(0),
    jenis: cell(1),
    alasan: cell(2),
    poin: cell(3),
    keterangan: cell(4),
  };
}

/**
 * Reads a SIKU file into its filled rows. A first row that holds a column
 * title is followed, and must then name every column but keterangan;
 * without one the columns are read in the order of the template.
 */
export function readSikuFile(text: string): Parsed<SikuLine[]> {
  const rows = readTitledRows(text, SIKU_FILE);
  if (!rows.ok) return rows;
  const lines = rows.value.map((row) => ({
    row: row.row,
    cells: cellsOf(row),
  }));
  return { ok: true, value: lines };
}

/** Each NIM the rows name, once, to look the students up by. */
export function fileNims(lines: readonly SikuLine[]): string[] {
  const nims = lines.map((line) => line.cells.nim).filter((nim) => nim !== "");
  return [...new Set(nims)];
}

function kindOf(text: string): SikuKind | null {
  const lowered = text.toLowerCase();
  if (GAIN_WORDS.includes(lowered)) return "gain";
  if (LOSS_WORDS.includes(lowered)) return "loss";
  return null;
}

/**
 * A reason of the kind by its number in the prototype's order, or by its
 * words, whole or their beginning, in any case.
 */
function reasonOf(kind: SikuKind, text: string): SikuReason | null {
  const reasons = reasonsOf(kind);
  if (DIGITS.test(text)) return reasons[Number(text) - 1] ?? null;
  const lowered = text.toLowerCase();
  if (lowered === "") return null;
  const named = reasons.find((reason) =>
    REASON_WORDS[reason].toLowerCase().startsWith(lowered),
  );
  return named ?? null;
}

function pointsOf(text: string): number | null {
  if (!WHOLE.test(text)) return null;
  const points = Number(text);
  if (points < POINTS_MIN || points > POINTS_MAX) return null;
  return points;
}

/** The note and the basis a keterangan becomes, by the form's rules. */
function noteAndBasis(
  reason: SikuReason,
  keterangan: string,
): Parsed<{ note: string; basis: string }> {
  if (reason !== REASON_WITH_BASIS) {
    if (keterangan.length > ENTRY_NOTE_MAX_LENGTH)
      return refused(NOTE_TOO_LONG);
    return { ok: true, value: { note: keterangan, basis: "" } };
  }
  if (keterangan === "") return refused(NEEDS_DIRECTOR_NOTE);
  if (keterangan.length > BASIS_MAX_LENGTH) return refused(BASIS_TOO_LONG);
  return { ok: true, value: { note: "", basis: keterangan } };
}

function studentOf(
  nim: string,
  known: ReadonlyMap<string, FileStudent>,
): Parsed<FileStudent> {
  const student = known.get(nim);
  if (!student) return refused(UNKNOWN_NIM);
  if (!student.active) return refused(NOT_ACTIVE);
  if (!student.visible) return refused(NOT_VISIBLE);
  return { ok: true, value: student };
}

/** Whether a row may be saved, and what it holds, or why it is skipped. */
function checkLine(
  line: SikuLine,
  known: ReadonlyMap<string, FileStudent>,
): Parsed<ReadySikuRow> {
  const { cells } = line;
  const student = studentOf(cells.nim, known);
  if (!student.ok) return student;
  const kind = kindOf(cells.jenis);
  if (kind === null) return refused(UNKNOWN_KIND);
  const reason = reasonOf(kind, cells.alasan);
  if (reason === null) return refused(UNKNOWN_REASON);
  const points = pointsOf(cells.poin);
  if (points === null) return refused(POINTS_NOT_IN_RANGE);
  const written = noteAndBasis(reason, cells.keterangan);
  if (!written.ok) return written;
  return {
    ok: true,
    value: {
      row: line.row,
      studentId: student.value.id,
      nim: cells.nim,
      name: student.value.name,
      kind,
      reason,
      points,
      ...written.value,
    },
  };
}

/**
 * Decides, row by row, ready or skipped and why. `known` holds the
 * students the file names, by NIM. A student may be in several rows:
 * each is a gain or a loss of its own, so every one is kept.
 */
export function sikuFileRows(
  lines: readonly SikuLine[],
  known: ReadonlyMap<string, FileStudent>,
): SikuFileRows {
  const ready: ReadySikuRow[] = [];
  const skipped: SkippedSikuRow[] = [];
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
