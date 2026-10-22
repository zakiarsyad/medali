import { and, eq, inArray, notInArray, type SQL } from "drizzle-orm";
import type { RowLimit } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { CharacterGrade } from "@/character-grades/character-grade";
import {
  gradeChoiceSql,
  readGradesOf,
} from "@/character-grades/student-grades";
import { rerataFromTotal } from "@/character-scores/assessment-score";
import { latestAssessments } from "@/character-scores/latest-assessments";
import { predicateSql } from "@/character-scores/predicate-sql";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import {
  NOT_ASSESSED_CHOICE,
  type PredicateChoice,
  type StudentListFilters,
} from "./student-list-address";

/** The scores a row of the Mahasiswa table shows. */
export interface ListScores {
  /** The Rerata of the latest assessment, or null for none. */
  rerata: number | null;
  grade: CharacterGrade;
}

const NO_GRADE: CharacterGrade = { complete: false };

function predicateChoiceSql(db: Database, choice: PredicateChoice): SQL {
  const latest = latestAssessments(db);
  const assessed = db.select({ id: latest.studentId }).from(latest);
  if (choice === NOT_ASSESSED_CHOICE) {
    return notInArray(students.id, assessed);
  }
  return inArray(
    students.id,
    assessed.where(eq(predicateSql(latest.total), choice)),
  );
}

/**
 * The students the predikat and grade choices let through, for the list
 * to filter, count and page by in the database, or nothing while neither
 * is chosen. The grade is worked out only for the rows of `limit`.
 */
export async function scoreFilterOf(
  db: Database,
  limit: RowLimit,
  filters: StudentListFilters,
  today: string,
): Promise<SQL | undefined> {
  const predicate =
    filters.predicate === null
      ? undefined
      : predicateChoiceSql(db, filters.predicate);
  const grade =
    filters.grade === null
      ? undefined
      : await gradeChoiceSql(db, visibleTo(limit), filters.grade, today);
  return and(predicate, grade);
}

async function readLatestTotals(
  db: Database,
  visible: SQL,
  ids: readonly string[],
): Promise<Map<string, number>> {
  if (ids.length === 0) return new Map();
  const latest = latestAssessments(db);
  const rows = await db
    .select({ id: latest.studentId, total: latest.total })
    .from(latest)
    .innerJoin(students, eq(students.id, latest.studentId))
    .where(and(visible, inArray(latest.studentId, [...ids])));
  return new Map(rows.map((row) => [row.id, row.total]));
}

function rerataOrNone(total: number | undefined): number | null {
  if (total === undefined) return null;
  return rerataFromTotal(total);
}

/**
 * The scores of the students of one page of the list, read once for all
 * of them. A student outside the rows of `limit` gets none.
 */
export async function readListScores(
  db: Database,
  limit: RowLimit,
  ids: readonly string[],
  today: string,
): Promise<Map<string, ListScores>> {
  const visible = visibleTo(limit);
  const [totals, grades] = await Promise.all([
    readLatestTotals(db, visible, ids),
    readGradesOf(db, visible, ids, today),
  ]);
  const scores = new Map<string, ListScores>();
  for (const id of ids) {
    scores.set(id, {
      rerata: rerataOrNone(totals.get(id)),
      grade: grades.get(id) ?? NO_GRADE,
    });
  }
  return scores;
}
