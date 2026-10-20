import { inArray } from "drizzle-orm";
import {
  earlierAssessments,
  latestAssessments,
} from "@/character-scores/latest-assessments";
import type { Database } from "@/db/connect";
import type { MemberScores } from "./score-averages";

function readLatest(db: Database, studentIds: string[]) {
  const latest = latestAssessments(db);
  return db
    .select({
      studentId: latest.studentId,
      M: latest.scoreM,
      E: latest.scoreE,
      D: latest.scoreD,
      A: latest.scoreA,
      L: latest.scoreL,
      I: latest.scoreI,
    })
    .from(latest)
    .where(inArray(latest.studentId, studentIds));
}

function readEarlier(db: Database, studentIds: string[]) {
  const earlier = earlierAssessments(db);
  return db
    .select({
      studentId: earlier.studentId,
      M: earlier.scoreM,
      E: earlier.scoreE,
      D: earlier.scoreD,
      A: earlier.scoreA,
      L: earlier.scoreL,
      I: earlier.scoreI,
    })
    .from(earlier)
    .where(inArray(earlier.studentId, studentIds));
}

/**
 * The latest assessment of each of these students that has one, with the
 * one before it, in one read of each for all of them. Asked only for the
 * members of a group or a mentor the account may see.
 */
export async function readMemberScores(
  db: Database,
  studentIds: string[],
): Promise<Map<string, MemberScores>> {
  const found = new Map<string, MemberScores>();
  if (studentIds.length === 0) return found;
  const [latest, earlier] = await Promise.all([
    readLatest(db, studentIds),
    readEarlier(db, studentIds),
  ]);
  const earlierOf = new Map(
    earlier.map(({ studentId, ...scores }) => [studentId, scores]),
  );
  for (const { studentId, ...scores } of latest) {
    found.set(studentId, {
      latest: scores,
      earlier: earlierOf.get(studentId) ?? null,
    });
  }
  return found;
}
