import { count, eq, type SQL, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { finalRankSql } from "@/health-notes/final-category-sql";
import type { FitnessCategory } from "@/health-notes/fitness-ids";
import { readFitnessLimits } from "@/health-notes/fitness-limits";
import { SERIOUSNESS } from "@/health-notes/health-category";
import { latestFitnessScores } from "@/health-notes/latest-fitness-scores";
import { latestHealthNotes } from "@/health-notes/latest-health-notes";
import { type PhysicalRecap, physicalRecapOf } from "./physical-recap";

function countedWhere(condition: SQL): SQL<number> {
  return sql<number>`(count(*) filter (where ${condition}))::int`;
}

function inCategory(rank: SQL, category: FitnessCategory): SQL<number> {
  const wanted = sql.raw(String(SERIOUSNESS[category]));
  return countedWhere(sql`${rank} = ${wanted}`);
}

/**
 * Kesehatan jasmani of the students `where` lets through. The database
 * counts them by their latest test and latest note in one row, so no
 * student leaves it, and only what may be shown leaves the server.
 */
export async function readPhysical(
  db: Database,
  where: SQL,
): Promise<PhysicalRecap> {
  const { limits } = await readFitnessLimits(db);
  const latest = latestFitnessScores(db);
  const note = latestHealthNotes(db);
  const rank = finalRankSql(latest.score, note.category, limits);
  const [tally] = await db
    .select({
      students: count(),
      tested: count(latest.studentId),
      byCategory: {
        excellent: inCategory(rank, "excellent"),
        good: inCategory(rank, "good"),
        attention: inCategory(rank, "attention"),
        medical: inCategory(rank, "medical"),
      },
    })
    .from(students)
    .leftJoin(latest, eq(latest.studentId, students.id))
    .leftJoin(note, eq(note.studentId, students.id))
    .where(where);
  if (!tally) throw new Error("Kesehatan jasmani was not counted.");
  return physicalRecapOf(tally);
}
