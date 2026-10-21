import { type SQL, type SQLWrapper, sql } from "drizzle-orm";
import { passes } from "@/features/character-grades/grade-letter";
import {
  GRADE_LETTERS,
  GRADE_PARTS,
  type GradeLetter,
  type GradePart,
  type GradeScheme,
  LIMITED_LETTERS,
} from "@/features/character-grades/scheme-ids";
import { SIKU_MAX, SIKU_MIN } from "@/features/siku/siku-score";
import { SKPM_MAX } from "@/features/skpm/skpm-score";

/*
 * The sums of the character grade, written for the database as well, so
 * that it can filter and count the grades of every student without
 * sending them all to the server. The server's own rules stay in force
 * for one student and for every other screen; a check works both out on
 * many values and holds them equal. Every sum is in float8, step by step
 * as the server does it, so both round alike.
 */

/**
 * Rounds as Math.round does, a half up. PostgreSQL rounds a half of a
 * float8 to the even side, so its round() would give 82 for 82.5.
 */
function rounded(value: SQL): SQL {
  return sql`floor(${value} + 0.5)`;
}

/** Nilai kehadiran as a percentage with one decimal, or null with nothing counted. */
export function percentSql(
  attended: SQLWrapper,
  counted: SQLWrapper,
): SQL<number | null> {
  const percent = sql`((${attended})::float8 / (${counted})) * 1000`;
  return sql`(case when (${counted}) = 0 then null else ${rounded(percent)} / 10 end)`;
}

/** SIKU akhir: Nilai dasar plus the gains minus the losses, within 0–100. */
export function sikuSql(
  base: number,
  gains: SQLWrapper,
  losses: SQLWrapper,
): SQL<number> {
  const sum = sql`${base}::integer + (${gains}) - (${losses})`;
  return sql`(least(${SIKU_MAX}::integer, greatest(${SIKU_MIN}::integer, ${sum})))::integer`;
}

/**
 * Nilai SKPM of a total of points, at most 100, to one decimal. The total
 * must not be null: least() of PostgreSQL passes over a null, so it
 * would give 100.
 */
export function skpmSql(
  total: SQLWrapper,
  pointsForHundred: number,
): SQL<number> {
  const score = sql`((${total})::float8 / ${pointsForHundred}::float8) * ${SKPM_MAX}::float8`;
  const highest = sql`least(${SKPM_MAX}::float8, ${score})`;
  return sql`(${rounded(sql`${highest} * 10`)} / 10)`;
}

/** Nilai akhir to one decimal, or null while a part is missing. */
export function finalSql(
  parts: Record<GradePart, SQLWrapper>,
  weights: Record<GradePart, number>,
): SQL<number | null> {
  const terms = GRADE_PARTS.map(
    (part) => sql`(${parts[part]})::float8 * ${weights[part]}::float8`,
  );
  const sum = sql.join(terms, sql` + `);
  return sql`(${rounded(sql`(${sum}) / 10`)} / 10)`;
}

/** The letter of a Nilai akhir by the lower limits of the scheme, or null for none. */
export function letterSql(
  final: SQLWrapper,
  scheme: GradeScheme,
): SQL<GradeLetter | null> {
  const limits = LIMITED_LETTERS.map(
    (letter) =>
      sql`when (${final}) >= ${scheme.lowerLimits[letter]}::float8 then ${letter}`,
  );
  return sql`(case when (${final}) is null then null ${sql.join(limits, sql` `)} else ${"E"} end)`;
}

/** Whether a Nilai akhir reaches the pass letter, or null for none. */
export function passesSql(
  final: SQLWrapper,
  scheme: GradeScheme,
): SQL<boolean | null> {
  const passing = GRADE_LETTERS.filter((letter) =>
    passes(letter, scheme.passLetter),
  );
  const letters = sql.join(
    passing.map((letter) => sql`${letter}`),
    sql`, `,
  );
  return sql`(case when (${final}) is null then null else ${letterSql(final, scheme)} in (${letters}) end)`;
}
