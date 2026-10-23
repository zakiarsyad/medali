import {
  and,
  count,
  eq,
  inArray,
  type SQL,
  type SQLWrapper,
  sql,
} from "drizzle-orm";
import {
  earlierAssessments,
  latestAssessments,
} from "@/character-scores/latest-assessments";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import type { MemberScores, ScoreSums } from "./score-averages";

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

function summed(score: SQLWrapper): SQL<number> {
  return sql<number>`coalesce(sum(${score}), 0)`.mapWith(Number);
}

function changeOf(latest: SQLWrapper, earlier: SQLWrapper): SQL {
  return sql`${latest} - ${earlier}`;
}

/**
 * The sums the medal of a whole list is drawn from, for the Aktif ones
 * among the students `listed` names, grouped by the total of their latest
 * scores. Only sums leave the database, however many students it holds.
 */
export function readScoreSums(db: Database, listed: SQL): Promise<ScoreSums[]> {
  const latest = latestAssessments(db);
  const earlier = earlierAssessments(db);
  return db
    .select({
      total: latest.total,
      students: count(),
      latest: {
        M: summed(latest.scoreM),
        E: summed(latest.scoreE),
        D: summed(latest.scoreD),
        A: summed(latest.scoreA),
        L: summed(latest.scoreL),
        I: summed(latest.scoreI),
      },
      changed: count(earlier.studentId),
      change: {
        M: summed(changeOf(latest.scoreM, earlier.scoreM)),
        E: summed(changeOf(latest.scoreE, earlier.scoreE)),
        D: summed(changeOf(latest.scoreD, earlier.scoreD)),
        A: summed(changeOf(latest.scoreA, earlier.scoreA)),
        L: summed(changeOf(latest.scoreL, earlier.scoreL)),
        I: summed(changeOf(latest.scoreI, earlier.scoreI)),
      },
    })
    .from(students)
    .innerJoin(latest, eq(latest.studentId, students.id))
    .leftJoin(earlier, eq(earlier.studentId, students.id))
    .where(and(listed, ACTIVE_MEMBER))
    .groupBy(latest.total);
}
