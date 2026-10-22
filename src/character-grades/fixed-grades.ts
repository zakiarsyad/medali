import type { fixedCharacterGrades } from "@/db/schema";
import type { CharacterGrade } from "./character-grade";
import type { GradeRow } from "./grade-list";

/** A student's grade as a closing keeps it, without the closing it belongs to. */
export type FixedGradeValues = Omit<
  typeof fixedCharacterGrades.$inferInsert,
  "closingId"
>;

/** How many students a closing keeps, how many grades are complete, and how many are not. */
export interface ClosingCounts {
  students: number;
  complete: number;
  incomplete: number;
}

type GradeValues = Pick<
  FixedGradeValues,
  "final" | "letter" | "passes" | "limitedFrom"
>;

const NO_GRADE: GradeValues = {
  final: null,
  letter: null,
  passes: null,
  limitedFrom: null,
};

function gradeValuesOf(grade: CharacterGrade): GradeValues {
  if (!grade.complete) return NO_GRADE;
  return {
    final: grade.final,
    letter: grade.letter,
    passes: grade.passes,
    limitedFrom: grade.limitedFrom ?? null,
  };
}

/** A row of the grade list as a closing keeps it, every part as it was shown. */
export function fixedGradeOf(row: GradeRow): FixedGradeValues {
  return {
    studentId: row.student.id,
    attendance: row.attendance.percent,
    attended: row.attendance.attended,
    counted: row.attendance.counted,
    mentoring: row.mentoring,
    siku: row.siku.score,
    sikuAdjusted: row.siku.adjusted,
    sikuNote: row.siku.note,
    skpm: row.skpm,
    ...gradeValuesOf(row.grade),
    limited: row.limited,
  };
}

export function closingCounts(rows: readonly GradeRow[]): ClosingCounts {
  let complete = 0;
  for (const row of rows) {
    if (row.grade.complete) complete += 1;
  }
  return {
    students: rows.length,
    complete,
    incomplete: rows.length - complete,
  };
}
