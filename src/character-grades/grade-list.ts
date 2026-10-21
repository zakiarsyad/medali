import {
  type CharacterGrade,
  gradeOf,
  type PartScores,
} from "./character-grade";
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

/** SIKU of a student as the grade list shows it. */
export interface SikuPart {
  /** SIKU akhir. */
  score: number;
  /** Whether an entry in force gained or lost the student points. */
  adjusted: boolean;
  /** Keterangan: Nilai dasar, or it with the gains and the losses. */
  note: string;
}

/** A student with each part as it is recorded where it belongs. */
export interface GradeInput {
  student: GradeStudent;
  attendance: AttendancePart;
  /** The score the Pengasuh gave this semester, or null for none. */
  mentoring: number | null;
  siku: SikuPart;
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
