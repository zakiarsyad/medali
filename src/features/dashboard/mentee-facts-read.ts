import { and, eq, inArray, type SQL, sql } from "drizzle-orm";
import { type GradeBasis, gradeFacts } from "@/character-grades/grade-facts";
import { letterOf, passes } from "@/character-grades/grade-letter";
import { rerataFromTotal } from "@/character-scores/assessment-score";
import {
  coachingLevelSql,
  listedForCoaching,
} from "@/character-scores/coaching-listed";
import type { CoachingLevel } from "@/character-scores/coaching-need";
import { NOT_DONE } from "@/character-scores/coaching-shown-status";
import { latestAssessments } from "@/character-scores/latest-assessments";
import type { Database } from "@/db/connect";
import { coachingStatuses, counsellingSharings, students } from "@/db/schema";
import { readLimitsOf } from "@/discipline-penalties/read-limits";
import { finalRankSql } from "@/health-notes/final-category-sql";
import {
  FITNESS_CATEGORIES,
  type FitnessCategory,
  type FitnessLimits,
} from "@/health-notes/fitness-ids";
import { SERIOUSNESS } from "@/health-notes/health-category";
import { latestFitnessScores } from "@/health-notes/latest-fitness-scores";
import { latestHealthNotes } from "@/health-notes/latest-health-notes";
import { logSharedReads } from "@/mental-health/log-shared-reads";
import type { ScreeningLevel } from "@/mental-health/screening-ids";
import { COUNSELLING_LEVELS } from "@/mental-health/screening-rules";
import { sharedLevels } from "@/mental-health/shared-levels";
import type { SharedReader } from "@/mental-health/shared-reach";
import { opensDetailOf } from "@/mentoring/opens-detail";
import type { MenteeFacts } from "./mentee-attention";
import type { MenteeScope } from "./mentee-scope";

const NOBODY = sql`false`;

/** The anak asuh with their average, coaching, fitness and the link to their detail. */
async function readBase(
  db: Database,
  scope: MenteeScope,
  limits: FitnessLimits,
) {
  const latest = latestAssessments(db);
  const fitness = latestFitnessScores(db);
  const note = latestHealthNotes(db);
  const coaching = and(listedForCoaching(latest), NOT_DONE) ?? NOBODY;
  return db
    .select({
      studentId: students.id,
      name: students.name,
      opensDetail: opensDetailOf(scope.detail),
      total: latest.total,
      coaching: sql<CoachingLevel | null>`case when ${coaching} then ${coachingLevelSql(latest)} end`,
      rank: finalRankSql(fitness.score, note.category, limits),
    })
    .from(students)
    .leftJoin(latest, eq(latest.studentId, students.id))
    .leftJoin(coachingStatuses, eq(coachingStatuses.studentId, students.id))
    .leftJoin(fitness, eq(fitness.studentId, students.id))
    .leftJoin(note, eq(note.studentId, students.id))
    .where(scope.mentees);
}

/** Each anak asuh's Nilai akhir and Nilai kehadiran, by the rule of Penilaian karakter. */
async function readGrades(db: Database, mentees: SQL, basis: GradeBasis) {
  const facts = gradeFacts(db, mentees, basis);
  return db
    .select({
      studentId: facts.studentId,
      final: facts.final,
      attendance: facts.attendance,
    })
    .from(facts);
}

/**
 * The level of each anak asuh published to the reader with the level, at
 * Sedang or worse: only those make a tag. Each one read is written to
 * the log of readings in the same transaction.
 */
async function readMentalTags(
  db: Database,
  mentees: SQL,
  reader: SharedReader | null,
  now: Date,
): Promise<Map<string, ScreeningLevel>> {
  const found = new Map<string, ScreeningLevel>();
  if (reader === null) return found;
  return db.transaction(async (tx) => {
    const { latest, joined } = sharedLevels(tx);
    const rows = await tx
      .select({
        sharingId: counsellingSharings.id,
        studentId: students.id,
        level: latest.level,
      })
      .from(counsellingSharings)
      .innerJoin(students, eq(students.id, counsellingSharings.studentId))
      .innerJoin(latest, joined)
      .where(
        and(
          reader.reach,
          mentees,
          inArray(latest.level, [...COUNSELLING_LEVELS]),
        ),
      );
    await logSharedReads(
      tx,
      reader.readerId,
      rows.map(({ sharingId, studentId }) => ({ sharingId, studentId })),
      now,
    );
    for (const row of rows) found.set(row.studentId, row.level);
    return found;
  });
}

function gradeOfFinal(
  final: number | null,
  basis: GradeBasis,
): MenteeFacts["grade"] {
  if (final === null) return null;
  const letter = letterOf(final, basis.scheme);
  return { letter, passes: passes(letter, basis.scheme.passLetter) };
}

function categoryOfRank(rank: number | null): FitnessCategory | null {
  if (rank === null) return null;
  return FITNESS_CATEGORIES.find((each) => SERIOUSNESS[each] === rank) ?? null;
}

/**
 * What "Perlu perhatian" needs of each Aktif anak asuh, in a few reads
 * for all of them together, never one read per student.
 */
export async function readMenteeFacts(
  db: Database,
  scope: MenteeScope,
  basis: GradeBasis,
  limits: FitnessLimits,
  now: Date = new Date(),
): Promise<MenteeFacts[]> {
  const [base, grades, mental] = await Promise.all([
    readBase(db, scope, limits),
    readGrades(db, scope.mentees, basis),
    readMentalTags(db, scope.mentees, scope.shared, now),
  ]);
  const penalties = await readLimitsOf(
    db,
    base.map((row) => row.studentId),
  );
  const gradeOf = new Map(grades.map((row) => [row.studentId, row]));
  return base.map((row) => ({
    studentId: row.studentId,
    name: row.name,
    opensDetail: row.opensDetail,
    rerata: row.total === null ? null : rerataFromTotal(row.total),
    coaching: row.coaching,
    grade: gradeOfFinal(gradeOf.get(row.studentId)?.final ?? null, basis),
    attendance: gradeOf.get(row.studentId)?.attendance ?? null,
    penalty: penalties.get(row.studentId)?.category ?? null,
    fitness: categoryOfRank(row.rank),
    mental: mental.get(row.studentId) ?? null,
  }));
}
