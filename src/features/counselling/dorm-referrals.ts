import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  ne,
  type SQL,
  sql,
} from "drizzle-orm";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import {
  accounts,
  counsellingConsents,
  counsellingSchedules,
  dormRoomPlaces,
  dormRooms,
  mentalHealthMarks,
  students,
  studyPrograms,
} from "@/db/schema";
import { readDormCohorts } from "@/dorms/dorm-cohorts";
import type { DormId } from "@/dorms/dorms";
import { dormInSql, isPlaceRoomOf } from "@/dorms/resident-condition";
import { pageWithin } from "@/ui/list-pages";
import { REFERRALS_PAGE_SIZE } from "./referral-address";
import type { ReferralList, ReferralRow } from "./referral-view";
import { ACTIVE_STATUSES, type ScheduleStatus } from "./schedule-ids";

/**
 * The students whose referrals the account may read, never the
 * account's own student; null for an account without the right.
 */
function referralReachOf(actor: AccountForAccess): SQL | null {
  if (!may(actor.roles, "view_dorm_referrals")) return null;
  const visible = visibleTo(rowLimitForAction(actor, "view_dorm_referrals"));
  if (actor.studentId === null) return visible;
  return and(visible, ne(students.id, actor.studentId)) ?? visible;
}

/** The status of the student row's active request; a student has one at most. */
const ACTIVE_SCHEDULE = sql<ScheduleStatus | null>`(
  select ${counsellingSchedules.status} from ${counsellingSchedules}
  where ${counsellingSchedules.studentId} = ${students.id}
    and ${inArray(counsellingSchedules.status, [...ACTIVE_STATUSES])}
  limit 1
)`;

interface ReadRow extends Omit<ReferralRow, "dorm" | "room"> {
  dorm: DormId | null;
  floor: number | null;
  roomNumber: string | null;
}

function referralRow(row: ReadRow): ReferralRow {
  const { dorm, floor, roomNumber, ...rest } = row;
  if (dorm === null) {
    throw new Error("A referral of a student outside the dorm was read.");
  }
  const room =
    floor === null || roomNumber === null
      ? null
      : { dorm, floor, number: roomNumber };
  return { ...rest, dorm, room };
}

/**
 * One page of "Rujukan potensi kesehatan mental dari asrama": each
 * resident who lives in a dorm today and whose current mark is "perlu
 * dirujuk ke konselor", the newest mark first, with only what the list
 * shows: with the student's consent and active request, so Konselor
 * knows what is already under way. Null, with nothing read, for an account without the right to
 * read dorm referrals. `today` is today on campus.
 */
export async function readDormReferrals(
  db: Database,
  actor: AccountForAccess,
  page: number,
  today: string,
): Promise<ReferralList | null> {
  const reach = referralReachOf(actor);
  if (reach === null) return null;
  const dorm = dormInSql((await readDormCohorts(db, today)) ?? []);
  const where = and(
    reach,
    eq(mentalHealthMarks.category, "refer"),
    sql`${dorm} is not null`,
  );
  const [found] = await db
    .select({ matching: count() })
    .from(mentalHealthMarks)
    .innerJoin(students, eq(students.id, mentalHealthMarks.studentId))
    .where(where);
  const matching = found?.matching ?? 0;
  const shown = pageWithin(page, matching, REFERRALS_PAGE_SIZE);
  const rows: ReadRow[] = await db
    .select({
      studentId: students.id,
      name: students.name,
      nim: students.nim,
      program: studyPrograms.name,
      dorm,
      floor: dormRooms.floor,
      roomNumber: dormRooms.number,
      observation: mentalHealthMarks.observation,
      markedAt: mentalHealthMarks.changedAt,
      markedBy: accounts.name,
      consent: counsellingConsents.status,
      activeSchedule: ACTIVE_SCHEDULE,
    })
    .from(mentalHealthMarks)
    .innerJoin(students, eq(students.id, mentalHealthMarks.studentId))
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .innerJoin(accounts, eq(accounts.id, mentalHealthMarks.changedBy))
    .leftJoin(
      counsellingConsents,
      eq(counsellingConsents.studentId, students.id),
    )
    .leftJoin(dormRoomPlaces, eq(dormRoomPlaces.studentId, students.id))
    .leftJoin(
      dormRooms,
      and(eq(dormRooms.id, dormRoomPlaces.roomId), isPlaceRoomOf(dorm)),
    )
    .where(where)
    .orderBy(desc(mentalHealthMarks.changedAt), asc(students.id))
    .limit(REFERRALS_PAGE_SIZE)
    .offset((shown - 1) * REFERRALS_PAGE_SIZE);
  return { rows: rows.map(referralRow), matching, page: shown };
}
