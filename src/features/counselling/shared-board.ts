import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { type AccountForAccess, may } from "@/auth/access";
import { NOT_REMOVED } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import {
  counsellingSessions,
  counsellingSharings,
  students,
  studyPrograms,
} from "@/db/schema";
import {
  logSharedReads,
  type SharedShowing,
} from "@/mental-health/log-shared-reads";
import { heldInLast30Days } from "@/mental-health/recent-sessions";
import type { ScreeningLevel } from "@/mental-health/screening-ids";
import {
  COUNSELLING_LEVELS,
  shownCount,
} from "@/mental-health/screening-rules";
import { sharedLevels } from "@/mental-health/shared-levels";
import { recipientRolesOf, sharedReachOf } from "@/mental-health/shared-reach";
import { MENTOR_NAME } from "@/mentoring/mentor-name";
import { pageWithin } from "@/ui/list-pages";
import { SHARED_PAGE_SIZE, type SharedList } from "./shared-view";

function isMenteesOnly(actor: AccountForAccess): boolean {
  const roles = recipientRolesOf(actor);
  return roles.length === 1 && roles[0] === "mentor";
}

/** The date of a published sharing, which the database keeps for every one. */
function publishedDate(publishedAt: Date | null): Date {
  if (publishedAt === null) throw new Error("A published sharing has no date.");
  return publishedAt;
}

/** The rows that show a level, each a showing for the log of readings. */
function shownLevels(
  rows: {
    sharingId: string;
    studentId: string;
    level: ScreeningLevel | null;
  }[],
): SharedShowing[] {
  return rows
    .filter((row) => row.level !== null)
    .map(({ sharingId, studentId }) => ({ sharingId, studentId }));
}

/**
 * One page of "Data yang dipublikasikan untuk Anda": each student whose
 * published sharing names one of the account's roles, within that role's
 * rows, the newest published first, then by name, with "Perlu konseling"
 * of them all. Only what the list shows is read: never the summary, the
 * sessions, the consent, or the scores, "Risiko" mark and note of a
 * screening; the level only where it is shared. Each row that shows a
 * level is logged in the same transaction. Null, with nothing read, for
 * an account without the right.
 */
export async function readSharedList(
  db: Database,
  actor: AccountForAccess,
  asked: number,
  now: Date = new Date(),
): Promise<SharedList | null> {
  const reach = sharedReachOf(actor);
  if (reach === null) return null;
  return db.transaction(async (tx) => {
    const { latest, joined } = sharedLevels(tx);
    const [found] = await tx
      .select({
        matching: count(),
        needCounselling: sql<number>`(count(*) filter (where ${inArray(latest.level, [...COUNSELLING_LEVELS])}))::int`,
      })
      .from(counsellingSharings)
      .innerJoin(students, eq(students.id, counsellingSharings.studentId))
      .leftJoin(latest, joined)
      .where(reach);
    const matching = found?.matching ?? 0;
    const page = pageWithin(asked, matching, SHARED_PAGE_SIZE);
    const rows = await tx
      .select({
        sharingId: counsellingSharings.id,
        studentId: students.id,
        name: students.name,
        nim: students.nim,
        program: studyPrograms.name,
        mentorName: MENTOR_NAME,
        data: counsellingSharings.data,
        level: latest.level,
        publishedAt: counsellingSharings.publishedAt,
      })
      .from(counsellingSharings)
      .innerJoin(students, eq(students.id, counsellingSharings.studentId))
      .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
      .leftJoin(latest, joined)
      .where(reach)
      .orderBy(
        desc(counsellingSharings.publishedAt),
        asc(students.name),
        asc(students.nim),
      )
      .limit(SHARED_PAGE_SIZE)
      .offset((page - 1) * SHARED_PAGE_SIZE);
    await logSharedReads(tx, actor.id, shownLevels(rows), now);
    return {
      rows: rows.map(({ sharingId, ...row }) => ({
        ...row,
        publishedAt: publishedDate(row.publishedAt),
      })),
      matching,
      needCounselling: found?.needCounselling ?? 0,
      page,
      menteesOnly: isMenteesOnly(actor),
    };
  });
}

/**
 * "Sesi konseling 30 hari" for the whole campus: the sessions held from
 * 30 days before today up to today, of students who are not removed,
 * the same for every recipient, with no names, and a count of 1 to 4
 * sent as "<5" only. Null, with nothing read, for an account without
 * the right.
 */
export async function readCampusSessionCount(
  db: Database,
  actor: AccountForAccess,
  now: Date = new Date(),
): Promise<string | null> {
  if (!may(actor.roles, "view_shared_counselling_data")) return null;
  const today = campusDay(now);
  const [found] = await db
    .select({ sessions: count() })
    .from(counsellingSessions)
    .innerJoin(students, eq(students.id, counsellingSessions.studentId))
    .where(and(heldInLast30Days(today), NOT_REMOVED));
  return shownCount(found?.sessions ?? 0);
}
