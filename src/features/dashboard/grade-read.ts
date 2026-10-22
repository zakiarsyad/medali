import { count, eq, type SQL, sql } from "drizzle-orm";
import { type GradeBasis, gradeFacts } from "@/character-grades/grade-facts";
import type { GradeScheme } from "@/character-grades/scheme-ids";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { type GradeGroup, type GradeRecap, gradeRecapOf } from "./grade-recap";

/** Nilai karakter of the students the Dashboard counts. */
export interface CharacterGrades {
  /** The scheme in force, which gives each part its weight and the pass letter. */
  scheme: GradeScheme;
  recap: GradeRecap;
}

/**
 * The students grouped by angkatan, jalur and Nilai akhir, held at 70
 * where a penalty limits it, each group with how many it holds and how
 * many of them are held. Every grade is worked out in the database by
 * the rule of Penilaian karakter, and only these few rows leave it.
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
    })
    .from(facts)
    .innerJoin(students, eq(students.id, facts.studentId))
    .groupBy(students.cohortYear, students.entryPath, facts.final);
}

/** Nilai karakter of the students `where` lets through, by the basis given. */
export async function readCharacterGrades(
  db: Database,
  where: SQL,
  basis: GradeBasis,
): Promise<CharacterGrades> {
  const groups = await readGradeGroups(db, where, basis);
  return { scheme: basis.scheme, recap: gradeRecapOf(groups, basis.scheme) };
}
