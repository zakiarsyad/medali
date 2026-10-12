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

/** What the screen shows of a checked file. */
export interface FilePreview {
  ready: number;
  /** The first ready rows, each as its cells in the order of the template. */
  firstRows: string[][];
  /** Rows skipped because they break a rule. */
  broken: number;
  /** Rows skipped only because their NIM is already registered. */
  registered: number;
  /**
   * The first skipped rows: those that break a rule come first, because
   * they are the ones to correct in the file.
   */
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
    student.email ?? NOT_FILLED,
  ];
}

export function previewOf(
  rows: FileRows,
  programs: StudyProgram[],
): FilePreview {
  const first = rows.ready.slice(0, PREVIEW_ROWS);
  const skipped = [...rows.skipped, ...rows.registered];
  return {
    ready: rows.ready.length,
    firstRows: first.map(({ student }) => cellsOf(student, programs)),
    broken: rows.skipped.length,
    registered: rows.registered.length,
    firstSkipped: skipped.slice(0, PREVIEW_SKIPPED),
    repeated: rows.repeated,
  };
}
