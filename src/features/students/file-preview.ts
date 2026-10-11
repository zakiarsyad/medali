import type { StudyProgram } from "@/db/study-programs";
import { ENTRY_PATH_LABELS, STATUS_LABELS } from "./labels";
import type { FileRows, SkippedRow } from "./student-file";
import type { StudentInput } from "./student-input";

/** How many ready rows and skipped rows the preview shows. */
export const PREVIEW_ROWS = 6;
export const PREVIEW_SKIPPED = 30;

const NOT_FILLED = "-";
const YES = "ya";
const SEX_LETTERS: Record<StudentInput["sex"], string> = {
  male: "L",
  female: "P",
};

/** What the screen shows of a checked file before anything is saved. */
export interface FilePreview {
  ready: number;
  /** The first ready rows, each as its cells in the order of the template. */
  firstRows: string[][];
  skipped: number;
  /** The first skipped rows. */
  firstSkipped: SkippedRow[];
  repeated: number;
}

function ticked(yes: boolean): string {
  return yes ? YES : NOT_FILLED;
}

function cellsOf(student: StudentInput, programs: StudyProgram[]): string[] {
  const program = programs.find((one) => one.id === student.studyProgramId);
  return [
    student.nim,
    student.name,
    program?.name ?? NOT_FILLED,
    ENTRY_PATH_LABELS[student.entryPath],
    SEX_LETTERS[student.sex],
    String(student.cohortYear),
    student.className ?? "",
    student.province ?? NOT_FILLED,
    student.originAgency ?? NOT_FILLED,
    ticked(student.isAffirmation),
    ticked(student.isSeedling),
    ticked(student.isInternational),
    STATUS_LABELS[student.status],
  ];
}

export function previewOf(
  rows: FileRows,
  programs: StudyProgram[],
): FilePreview {
  const first = rows.ready.slice(0, PREVIEW_ROWS);
  return {
    ready: rows.ready.length,
    firstRows: first.map(({ student }) => cellsOf(student, programs)),
    skipped: rows.skipped.length,
    firstSkipped: rows.skipped.slice(0, PREVIEW_SKIPPED),
    repeated: rows.repeated,
  };
}
