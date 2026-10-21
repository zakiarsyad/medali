import { count, type SQL, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { type GradeBasis, gradeFacts } from "./grade-facts";
import { type GradeNumbers, gradeNumbersFrom } from "./grade-numbers";

/**
 * The four numbers above "Skema bobot", of the Aktif students `visible`
 * lets through, counted in the database, so one row leaves it. Nilai
 * akhir is added in the order of the list, as the server added it, so
 * the mean rounds as it did.
 */
export async function readGradeNumbers(
  db: Database,
  visible: SQL,
  basis: GradeBasis,
): Promise<GradeNumbers> {
  const facts = gradeFacts(db, visible, basis);
  const [totals] = await db
    .select({
      students: count(),
      complete: count(facts.final),
      passing: sql<number>`count(*) filter (where ${facts.passes})`.mapWith(
        Number,
      ),
      adjusted: sql<number>`count(*) filter (where ${facts.adjusted})`.mapWith(
        Number,
      ),
      finalSum: sql<
        number | null
      >`sum(${facts.final} order by ${facts.name}, ${facts.nim})`.mapWith(
        Number,
      ),
    })
    .from(facts);
  if (!totals) throw new Error("Counting the grades gave no row.");
  return gradeNumbersFrom(totals);
}
