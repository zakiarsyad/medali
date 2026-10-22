import { type Column, count, type SQL, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { type GradeBasis, gradeFacts } from "./grade-facts";
import { type GradeNumbers, gradeNumbersFrom } from "./grade-numbers";

type Field = Column | SQL.Aliased;

/** What the numbers count, live or fixed. */
export interface NumberFacts {
  name: Field;
  nim: Field;
  final: Field;
  passes: Field;
  adjusted: Field;
  limited: Field;
}

/**
 * What the database counts the numbers from, one row for all the
 * students. Nilai akhir is added in the order of the list, as the server
 * added it, so the mean rounds as it did.
 */
export function totalsOf(facts: NumberFacts) {
  return {
    students: count(),
    complete: count(facts.final),
    passing: sql<number>`count(*) filter (where ${facts.passes})`.mapWith(
      Number,
    ),
    adjusted: sql<number>`count(*) filter (where ${facts.adjusted})`.mapWith(
      Number,
    ),
    limited: sql<number>`count(*) filter (where ${facts.limited})`.mapWith(
      Number,
    ),
    finalSum: sql<
      number | null
    >`sum(${facts.final} order by ${facts.name}, ${facts.nim})`.mapWith(Number),
  };
}

/**
 * The numbers above "Skema bobot", of the Aktif students `visible`
 * lets through, counted in the database, so one row leaves it.
 */
export async function readGradeNumbers(
  db: Database,
  visible: SQL,
  basis: GradeBasis,
): Promise<GradeNumbers> {
  const facts = gradeFacts(db, visible, basis);
  const [totals] = await db.select(totalsOf(facts)).from(facts);
  if (!totals) throw new Error("Counting the grades gave no row.");
  return gradeNumbersFrom(totals);
}
