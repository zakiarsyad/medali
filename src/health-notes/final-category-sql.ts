import { type Column, type SQL, sql } from "drizzle-orm";
import type { FitnessCategory, FitnessLimits } from "./fitness-ids";
import { SERIOUSNESS } from "./health-category";
import { NOTE_CATEGORIES } from "./health-ids";

/*
 * The final-category rule of health-category.ts, said again in the
 * database, so a list can be narrowed and sorted by it a page at a time.
 * Its check runs both on every score and note.
 */

type Operand = SQL | SQL.Aliased | Column;

function rank(category: FitnessCategory): SQL {
  return sql.raw(String(SERIOUSNESS[category]));
}

/** How serious the category of a score is, as categoryOf decides; null for no score. */
function testRankSql(score: Operand, limits: FitnessLimits): SQL {
  return sql`case
    when ${score} is null then null
    when ${score} >= ${limits.excellentFrom} then ${rank("excellent")}
    when ${score} >= ${limits.goodFrom} then ${rank("good")}
    when ${score} >= ${limits.attentionFrom} then ${rank("attention")}
    else ${rank("medical")} end`;
}

/** How serious the category a note sets is; null when it follows the test. */
function noteRankSql(category: Operand): SQL {
  const whens = NOTE_CATEGORIES.map(
    (each) => sql`when ${category} = ${each} then ${rank(each)}`,
  );
  return sql`case ${sql.join(whens, sql` `)} end`;
}

/**
 * How serious a student's final category is: the more serious of their
 * latest test's and their latest note's, by SERIOUSNESS; null for Belum
 * dites. The database's greatest() passes over a null.
 */
export function finalRankSql(
  score: Operand,
  noteCategory: Operand,
  limits: FitnessLimits,
): SQL<number | null> {
  return sql<
    number | null
  >`greatest(${testRankSql(score, limits)}, ${noteRankSql(noteCategory)})`;
}
