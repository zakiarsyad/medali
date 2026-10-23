import { and, count, countDistinct, eq, type SQL, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { healthNoteIllnesses, students } from "@/db/schema";
import { finalRankSql } from "@/health-notes/final-category-sql";
import type {
  FitnessCategory,
  FitnessLimits,
} from "@/health-notes/fitness-ids";
import { SERIOUSNESS } from "@/health-notes/health-category";
import { latestFitnessScores } from "@/health-notes/latest-fitness-scores";
import { latestHealthNotes } from "@/health-notes/latest-health-notes";
import { FEWEST_COUNTED } from "@/health-notes/shown-count";
import {
  type FitnessTally,
  type IllnessTally,
  type PhysicalRecap,
  physicalRecapOf,
} from "./physical-recap";

function countedWhere(condition: SQL): SQL<number> {
  return sql<number>`(count(*) filter (where ${condition}))::int`;
}

function rankOf(category: FitnessCategory): SQL {
  return sql.raw(String(SERIOUSNESS[category]));
}

function inCategory(rank: SQL, category: FitnessCategory): SQL<number> {
  return countedWhere(sql`${rank} = ${rankOf(category)}`);
}

type Parts = ReturnType<typeof partsOf>;

/** Each student's latest test and note, and their final category. */
function partsOf(db: Database, limits: FitnessLimits) {
  const latest = latestFitnessScores(db);
  const note = latestHealthNotes(db);
  const rank = finalRankSql(latest.score, note.category, limits);
  return { latest, note, rank };
}

async function readTally(
  db: Database,
  parts: Parts,
  where: SQL,
): Promise<FitnessTally> {
  const { latest, note, rank } = parts;
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
  return tally;
}

/**
 * How many students of Perlu perhatian or Perlu tindak lanjut medis have
 * each illness in their latest note. Only these counts leave the
 * database, never a student.
 */
async function readIllnesses(
  db: Database,
  parts: Parts,
  where: SQL,
): Promise<IllnessTally[]> {
  const { latest, note, rank } = parts;
  return db
    .select({
      illness: healthNoteIllnesses.illness,
      students: countDistinct(students.id),
    })
    .from(students)
    .innerJoin(note, eq(note.studentId, students.id))
    .innerJoin(healthNoteIllnesses, eq(healthNoteIllnesses.noteId, note.noteId))
    .leftJoin(latest, eq(latest.studentId, students.id))
    .where(and(where, sql`${rank} >= ${rankOf("attention")}`))
    .groupBy(healthNoteIllnesses.illness);
}

/**
 * Kesehatan jasmani of the students `where` lets through, with the
 * limits in force, worked out by the database, so no student leaves it. The illnesses are read only of
 * the students `illnesses` lets through, and only once enough are tested
 * for any count to be shown; with null none is read. `fewest` is the
 * fewest tested for any count, an illness's too, to be given out.
 */
export async function readPhysical(
  db: Database,
  limits: FitnessLimits,
  where: SQL,
  illnesses: SQL | null,
  fewest: number = FEWEST_COUNTED,
): Promise<PhysicalRecap> {
  const parts = partsOf(db, limits);
  const tally = await readTally(db, parts, where);
  const countsIllnesses = illnesses !== null && tally.tested >= fewest;
  const found = countsIllnesses
    ? await readIllnesses(db, parts, and(where, illnesses) ?? where)
    : null;
  return physicalRecapOf(tally, found, fewest);
}
