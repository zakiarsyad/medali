import { pageWithin } from "@/ui/list-pages";
import {
  type CharacterGrade,
  gradeOf,
  type PartScores,
} from "./character-grade";
import {
  GRADE_LIST_PAGE_SIZE,
  type GradeFilter,
  type GradeParams,
} from "./grade-address";
import type { GradeScheme } from "./scheme-ids";

/** A student of "Daftar nilai karakter". */
export interface GradeStudent {
  id: string;
  name: string;
  nim: string;
  program: string;
}

/** Nilai kehadiran with how many of how many it is counted over. */
export interface AttendancePart {
  /** The score, or null with nothing counted yet. */
  percent: number | null;
  attended: number;
  counted: number;
}

/** A student with each part as it is recorded where it belongs. */
export interface GradeInput {
  student: GradeStudent;
  attendance: AttendancePart;
  /** The score the Pengasuh gave this semester, or null for none. */
  mentoring: number | null;
  siku: {
    /** SIKU akhir. */
    score: number;
    /** Whether an entry in force gained or lost the student points. */
    adjusted: boolean;
    /** Keterangan: Nilai dasar, or it with the gains and the losses. */
    note: string;
  };
  /** Nilai SKPM, or null while no SKPM upload counts. */
  skpm: number | null;
}

/** One row of "Daftar nilai karakter". */
export interface GradeRow extends GradeInput {
  grade: CharacterGrade;
}

export interface GradeList {
  rows: GradeRow[];
  /** How many students the search and the filter let through. */
  matching: number;
  /** The page shown, the last one when the address asked for more. */
  page: number;
}

/** The four parts of a student's grade, each a score or missing. */
export function partScoresOf(input: GradeInput): PartScores {
  return {
    attendance: input.attendance.percent,
    mentoring: input.mentoring,
    siku: input.siku.score,
    skpm: input.skpm,
  };
}

/** A student with the grade the scheme gives their parts. */
export function gradeRowOf(input: GradeInput, scheme: GradeScheme): GradeRow {
  return { ...input, grade: gradeOf(partScoresOf(input), scheme) };
}

/** Whether a row's grade is worked out and does not reach the pass letter. */
export function isFailing(row: GradeRow): boolean {
  return row.grade.complete && !row.grade.passes;
}

function isKept(row: GradeRow, filter: GradeFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "failing":
      return isFailing(row);
    case "incomplete":
      return !row.grade.complete;
  }
}

function isFound(row: GradeRow, query: string): boolean {
  if (query === "") return true;
  const sought = query.toLocaleLowerCase("id-ID");
  const { name, nim } = row.student;
  return (
    name.toLocaleLowerCase("id-ID").includes(sought) || nim.includes(sought)
  );
}

/**
 * One page of "Daftar nilai karakter": the rows that match the search, by
 * name or NIM, and the filter, in the order they are given.
 */
export function gradeListOf(
  rows: readonly GradeRow[],
  params: GradeParams,
): GradeList {
  const kept = rows.filter(
    (row) => isKept(row, params.filter) && isFound(row, params.query),
  );
  const page = pageWithin(params.page, kept.length, GRADE_LIST_PAGE_SIZE);
  const start = (page - 1) * GRADE_LIST_PAGE_SIZE;
  return {
    rows: kept.slice(start, start + GRADE_LIST_PAGE_SIZE),
    matching: kept.length,
    page,
  };
}
