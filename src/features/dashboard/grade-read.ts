import { count, eq, type SQL, type SQLWrapper, sql } from "drizzle-orm";
import { type GradeBasis, gradeFacts } from "@/character-grades/grade-facts";
import { readGradeNumbers } from "@/character-grades/read-grade-numbers";
import type { GradeScheme } from "@/character-grades/scheme-ids";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { FEWEST_SHOWN } from "./achievement-recap";
import {
  type GradeCohort,
  type GradeGroup,
  type GradeRecap,
  gradeCohorts,
  gradeRecapOf,
} from "./grade-recap";

/** Nilai karakter of the students the Dashboard counts. */
export interface CharacterGrades {
  /** The scheme in force, which gives each part its weight and the pass letter. */
  scheme: GradeScheme;
  recap: GradeRecap;
  /** The rows of "Nilai karakter per angkatan" that may be shown. */
  cohorts: GradeCohort[];
}

function sumOf(part: SQLWrapper): SQL<number> {
  return sql<number>`coalesce(sum(${part}), 0)`.mapWith(Number);
}

/**
 * The students grouped by angkatan, jalur and Nilai akhir, held at 70
 * where a penalty limits it, each group with how many it holds, how
 * many of them are held, and the sum of each part. Every grade is worked
 * out in the database by the rule of Penilaian karakter, and only these
 * few rows leave it.
 */
async function readGradeGroups(
  db: Database,
  where: SQL,
  basis: GradeBasis,
): Promise<GradeGroup[]> {
  const facts = gradeFacts(db, where, basis);
  return db
    .select({
      cohortYear: students.cohortYear,
      entryPath: students.entryPath,
      final: facts.final,
      students: count(),
      limited: sql<number>`count(*) filter (where ${facts.limited})`.mapWith(
        Number,
      ),
      sums: {
        attendance: sumOf(facts.attendance),
        mentoring: sumOf(facts.mentoring),
        siku: sumOf(facts.siku),
        skpm: sumOf(facts.skpm),
      },
    })
    .from(facts)
    .innerJoin(students, eq(students.id, facts.studentId))
    .groupBy(students.cohortYear, students.entryPath, facts.final);
}

/**
 * Nilai karakter of the students `where` lets through, by the basis
 * given. `filtered` tells whether a filter is in use, which lets smaller
 * cohorts be shown; `fewest` is the fewest worked-out grades for any
 * number to be given out.
 */
export async function readCharacterGrades(
  db: Database,
  where: SQL,
  basis: GradeBasis,
  filtered: boolean,
  fewest: number = FEWEST_SHOWN,
): Promise<CharacterGrades> {
  const { scheme } = basis;
  const [groups, numbers] = await Promise.all([
    readGradeGroups(db, where, basis),
    readGradeNumbers(db, where, basis),
  ]);
  const recap = gradeRecapOf(groups, scheme, fewest);
  // Rerata nilai akhir is taken as Penilaian karakter takes it, so the two
  // pages never round the same students apart.
  if (recap.kind === "shown" && numbers.meanFinal !== null) {
    recap.meanFinal = numbers.meanFinal;
  }
  return {
    scheme,
    recap,
    cohorts: gradeCohorts(groups, scheme, filtered),
  };
}
