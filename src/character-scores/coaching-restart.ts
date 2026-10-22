import { and, asc, eq, inArray, not, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { coachingStatusChanges, coachingStatuses } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { Scores } from "./assessment-score";
import { isIdentifiedAgain } from "./coaching-again";
import { FIRST_COACHING_STATUS } from "./coaching-status";
import { earlierAssessments, latestAssessments } from "./latest-assessments";

/** A saved status other than Teridentifikasi with no note. */
const MOVED_ON = not(
  and(
    eq(coachingStatuses.status, FIRST_COACHING_STATUS),
    eq(coachingStatuses.note, ""),
  ) ?? sql`false`,
);

interface HeldStatus {
  studentId: string;
  status: (typeof coachingStatuses.$inferSelect)["status"];
  note: string;
  latest: Scores;
  earlier: Scores | null;
}

/**
 * The saved statuses of these students that moved on from Teridentifikasi,
 * with their latest assessment and the one before it, held until the
 * save ends, in the order of their keys so two saves never wait for each
 * other in a ring.
 */
async function holdMovedOn(
  tx: Database,
  studentIds: string[],
): Promise<HeldStatus[]> {
  const latest = latestAssessments(tx);
  const earlier = earlierAssessments(tx);
  const found = await tx
    .select({
      studentId: coachingStatuses.studentId,
      status: coachingStatuses.status,
      note: coachingStatuses.note,
      latestM: latest.scoreM,
      latestE: latest.scoreE,
      latestD: latest.scoreD,
      latestA: latest.scoreA,
      latestL: latest.scoreL,
      latestI: latest.scoreI,
      earlierM: earlier.scoreM,
      earlierE: earlier.scoreE,
      earlierD: earlier.scoreD,
      earlierA: earlier.scoreA,
      earlierL: earlier.scoreL,
      earlierI: earlier.scoreI,
    })
    .from(coachingStatuses)
    .innerJoin(latest, eq(latest.studentId, coachingStatuses.studentId))
    .leftJoin(earlier, eq(earlier.studentId, coachingStatuses.studentId))
    .where(and(inArray(coachingStatuses.studentId, studentIds), MOVED_ON))
    .orderBy(asc(coachingStatuses.studentId))
    .for("update", { of: coachingStatuses });
  return found.map((row) => ({
    studentId: row.studentId,
    status: row.status,
    note: row.note,
    latest: {
      M: row.latestM,
      E: row.latestE,
      D: row.latestD,
      A: row.latestA,
      L: row.latestL,
      I: row.latestI,
    },
    earlier: earlierOf(row),
  }));
}

function earlierOf(row: {
  earlierM: number | null;
  earlierE: number | null;
  earlierD: number | null;
  earlierA: number | null;
  earlierL: number | null;
  earlierI: number | null;
}): Scores | null {
  const { earlierM, earlierE, earlierD, earlierA, earlierL, earlierI } = row;
  if (
    earlierM === null ||
    earlierE === null ||
    earlierD === null ||
    earlierA === null ||
    earlierL === null ||
    earlierI === null
  ) {
    return null;
  }
  return {
    M: earlierM,
    E: earlierE,
    D: earlierD,
    A: earlierA,
    L: earlierL,
    I: earlierI,
  };
}

/** Puts one student back at Teridentifikasi with no note, and logs it. */
async function restart(
  tx: Database,
  held: HeldStatus,
  actorId: string,
): Promise<void> {
  await tx
    .update(coachingStatuses)
    .set({
      status: FIRST_COACHING_STATUS,
      note: "",
      version: sql`${coachingStatuses.version} + 1`,
      changedBy: actorId,
      changedAt: WRITTEN_NOW,
    })
    .where(eq(coachingStatuses.studentId, held.studentId));
  await tx.insert(coachingStatusChanges).values({
    studentId: held.studentId,
    statusBefore: held.status,
    noteBefore: held.note,
    statusAfter: FIRST_COACHING_STATUS,
    noteAfter: "",
    changedBy: actorId,
    changedAt: WRITTEN_NOW,
  });
}

/**
 * After new assessments of these students are kept, in the same
 * transaction: a student whose new latest assessment lists them while
 * the one before did not, and whose saved status moved on, starts again
 * at Teridentifikasi with no note, logged as the work of the one who
 * saved the assessment. A student never given a status shows as
 * Teridentifikasi already, so nothing is kept for them.
 */
export async function restartReturningCoaching(
  tx: Database,
  studentIds: string[],
  actorId: string,
): Promise<void> {
  if (studentIds.length === 0) return;
  const held = await holdMovedOn(tx, [...new Set(studentIds)]);
  for (const one of held) {
    if (!isIdentifiedAgain(one.latest, one.earlier)) continue;
    await restart(tx, one, actorId);
  }
}
