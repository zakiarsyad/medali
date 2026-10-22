import { and, eq, type SQL, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { fixedCharacterGrades, students, studyPrograms } from "@/db/schema";
import type { CharacterGrade } from "./character-grade";
import type { GradeRow } from "./grade-list";
import type { GradeLetter } from "./scheme-ids";

/** A fixed grade as it is read, with its student as they are named today. */
export interface StoredFixedGrade {
  studentId: string;
  name: string;
  nim: string;
  program: string;
  attendance: number | null;
  attended: number;
  counted: number;
  mentoring: number | null;
  siku: number;
  sikuAdjusted: boolean;
  sikuNote: string;
  skpm: number | null;
  final: number | null;
  letter: GradeLetter | null;
  passes: boolean | null;
  limited: boolean;
  limitedFrom: number | null;
}

function fixedGradeOfStored(stored: StoredFixedGrade): CharacterGrade {
  const { final, letter, passes, limitedFrom } = stored;
  if (final === null || letter === null || passes === null) {
    return { complete: false };
  }
  const grade: CharacterGrade = { complete: true, final, letter, passes };
  if (limitedFrom === null) return grade;
  return { ...grade, limitedFrom };
}

/** A fixed grade as a row of "Daftar nilai karakter", every part as the closing kept it. */
export function fixedRowOf(stored: StoredFixedGrade): GradeRow {
  return {
    student: {
      id: stored.studentId,
      name: stored.name,
      nim: stored.nim,
      program: stored.program,
    },
    attendance: {
      percent: stored.attendance,
      attended: stored.attended,
      counted: stored.counted,
    },
    mentoring: stored.mentoring,
    siku: {
      score: stored.siku,
      adjusted: stored.sikuAdjusted,
      note: stored.sikuNote,
    },
    skpm: stored.skpm,
    grade: fixedGradeOfStored(stored),
    limited: stored.limited,
  };
}

const NO_NAME_OPENS = sql`false`;

/**
 * The fixed grades one closing kept of the students `visible` lets
 * through, whatever their status today, as a table to read from. `opens`
 * tells whether a student's name opens them over the tab.
 */
export function fixedFacts(
  db: Database,
  visible: SQL,
  closingId: string,
  opens: SQL = NO_NAME_OPENS,
) {
  const grades = fixedCharacterGrades;
  return db
    .select({
      studentId: grades.studentId,
      name: students.name,
      nim: students.nim,
      program: sql<string>`${studyPrograms.name}`.as("program"),
      attendance: grades.attendance,
      attended: grades.attended,
      counted: grades.counted,
      mentoring: grades.mentoring,
      siku: grades.siku,
      sikuAdjusted: grades.sikuAdjusted,
      sikuNote: grades.sikuNote,
      skpm: grades.skpm,
      final: grades.final,
      letter: grades.letter,
      passes: grades.passes,
      limited: grades.limited,
      limitedFrom: grades.limitedFrom,
      opens: sql<boolean>`(${opens})`.as("opens"),
    })
    .from(grades)
    .innerJoin(students, eq(students.id, grades.studentId))
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .where(and(eq(grades.closingId, closingId), visible))
    .as("fixed_facts");
}
