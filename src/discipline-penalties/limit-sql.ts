import { inArray, type SQL, type SQLWrapper, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { disciplinePenalties } from "@/db/schema";
import { CHARACTER_SCORE_CAP, LIMITING_CATEGORIES } from "./score-limit";

/*
 * The limit written for the database as well, so that a list filters,
 * counts and pages by the limited scores without sending every student
 * to the server. The rules in score-limit stay in force for the server;
 * a check works both out and holds them equal.
 */

/**
 * Each student with a Ringan or Sedang penalty, whatever its status or
 * date, once, as a table to left join a read of students to.
 */
export function limitedStudents(db: Database) {
  return db
    .selectDistinct({ studentId: disciplinePenalties.studentId })
    .from(disciplinePenalties)
    .where(inArray(disciplinePenalties.category, [...LIMITING_CATEGORIES]))
    .as("limited_students");
}

/** Whether the student of a row the table was left joined to is limited. */
export function isLimitedSql(
  limited: ReturnType<typeof limitedStudents>,
): SQL<boolean> {
  return sql<boolean>`(${limited.studentId} is not null)`;
}

/**
 * A score or a final nilai karakter as it counts: at most 70 when
 * `limited`. A missing one stays missing: least() of PostgreSQL passes
 * over a null, so it would give 70.
 */
export function limitedScoreSql(
  score: SQLWrapper,
  limited: SQLWrapper,
): SQL<number> {
  return sql<number>`(case when (${limited}) and (${score}) > ${CHARACTER_SCORE_CAP}::integer then ${CHARACTER_SCORE_CAP}::integer else (${score}) end)`;
}
