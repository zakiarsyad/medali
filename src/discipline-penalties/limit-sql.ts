import { getTableName, type SQL, type SQLWrapper, sql } from "drizzle-orm";
import { type AnyPgColumn, alias } from "drizzle-orm/pg-core";
import { disciplinePenalties } from "@/db/schema";
import { CHARACTER_SCORE_CAP, LIMITING_CATEGORIES } from "./score-limit";

/*
 * The limit written for the database as well, so that a list filters,
 * counts and pages by the limited scores without sending every student
 * to the server. The rules in score-limit stay in force for the server;
 * a check works both out and holds them equal.
 */

/** A name of its own, so the read it is put in is not confused. */
const PENALTY_NAME = "limiting_penalty";
const penalty = alias(disciplinePenalties, PENALTY_NAME);

const LIMITING = sql.join(
  LIMITING_CATEGORIES.map((category) => sql`${category}`),
  sql`, `,
);

/**
 * A column with its table always named. A read of one table names its
 * columns bare, and a bare "id" inside the inner read below would be the
 * penalty's own.
 */
function named(column: AnyPgColumn): SQL {
  return sql`${sql.identifier(getTableName(column.table))}.${sql.identifier(column.name)}`;
}

/** Whether the student of `studentId` has a Ringan or Sedang penalty, whatever its status or date. */
export function limitedSql(studentId: AnyPgColumn): SQL<boolean> {
  return sql<boolean>`exists (select 1 from ${disciplinePenalties} as ${sql.identifier(PENALTY_NAME)} where ${penalty.studentId} = ${named(studentId)} and ${penalty.category} in (${LIMITING}))`;
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
