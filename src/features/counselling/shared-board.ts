import { and, asc, count, desc, eq, gte, lte } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { daysBefore } from "@/academic-periods/days-before";
import { type AccountForAccess, may } from "@/auth/access";
import { NOT_REMOVED } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import {
  counsellingSessions,
  counsellingSharings,
  students,
  studyPrograms,
} from "@/db/schema";
import { MENTOR_NAME } from "@/mentoring/mentor-name";
import { pageWithin } from "@/ui/list-pages";
import { shownCount } from "./screening-rules";
import { recipientRolesOf, sharedReachOf } from "./shared-reach";
import { SHARED_PAGE_SIZE, type SharedList } from "./shared-view";

/** The days "Sesi konseling 30 hari" looks back over, today not counted. */
const SESSION_DAYS = 30;

function isMenteesOnly(actor: AccountForAccess): boolean {
  const roles = recipientRolesOf(actor);
  return roles.length === 1 && roles[0] === "mentor";
}

/** The date of a published sharing, which the database keeps for every one. */
function publishedDate(publishedAt: Date | null): Date {
  if (publishedAt === null) throw new Error("A published sharing has no date.");
  return publishedAt;
}

/**
 * One page of "Data yang dipublikasikan untuk Anda": each student whose
 * published sharing names one of the account's roles, within that role's
 * rows, the newest published first, then by name. Only what the list
 * shows is read: never the summary, the sessions or the consent. Null,
 * with nothing read, for an account without the right.
 */
export async function readSharedList(
  db: Database,
  actor: AccountForAccess,
  asked: number,
): Promise<SharedList | null> {
  const reach = sharedReachOf(actor);
  if (reach === null) return null;
  const [found] = await db
    .select({ matching: count() })
    .from(counsellingSharings)
    .innerJoin(students, eq(students.id, counsellingSharings.studentId))
    .where(reach);
  const matching = found?.matching ?? 0;
  const page = pageWithin(asked, matching, SHARED_PAGE_SIZE);
  const rows = await db
    .select({
      studentId: students.id,
      name: students.name,
      nim: students.nim,
      program: studyPrograms.name,
      mentorName: MENTOR_NAME,
      data: counsellingSharings.data,
      publishedAt: counsellingSharings.publishedAt,
    })
    .from(counsellingSharings)
    .innerJoin(students, eq(students.id, counsellingSharings.studentId))
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .where(reach)
    .orderBy(
      desc(counsellingSharings.publishedAt),
      asc(students.name),
      asc(students.nim),
    )
    .limit(SHARED_PAGE_SIZE)
    .offset((page - 1) * SHARED_PAGE_SIZE);
  return {
    rows: rows.map((row) => ({
      ...row,
      publishedAt: publishedDate(row.publishedAt),
    })),
    matching,
    page,
    menteesOnly: isMenteesOnly(actor),
  };
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
    .where(
      and(
        gte(counsellingSessions.day, daysBefore(today, SESSION_DAYS)),
        lte(counsellingSessions.day, today),
        NOT_REMOVED,
      ),
    );
  return shownCount(found?.sessions ?? 0);
}
