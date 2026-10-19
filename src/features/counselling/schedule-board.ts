import { and, asc, count, eq, inArray, type SQL, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { campusDay } from "@/academic-periods/campus-day";
import { daysAfter } from "@/academic-periods/days-after";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { versionOf } from "@/db/row-version";
import {
  accounts,
  counsellingScheduleChanges,
  counsellingSchedules,
  students,
  studyPrograms,
} from "@/db/schema";
import { shownMoment } from "@/ui/day";
import { pageWithin } from "@/ui/list-pages";
import {
  SCHEDULES_PAGE_SIZE,
  type ScheduleListParams,
  statusesOf,
} from "./schedule-address";
import type {
  CounsellorScheduleCard,
  ScheduleBoard,
  ScheduleCounts,
  ScheduleStepView,
} from "./schedule-view";

/** How many days ahead "Dijadwalkan 7 hari ke depan" looks. */
const SOON_DAYS = 7;

const OF_STUDENT = eq(students.id, counsellingSchedules.studentId);

const NONE: ScheduleCounts = { submitted: 0, scheduledSoon: 0, proposed: 0 };

/** Diajukan first, then Usulan jadwal lain, then Dijadwalkan. */
const STATUS_ORDER = sql`case ${counsellingSchedules.status}
  when 'submitted' then 0 when 'proposed' then 1 else 2 end`;

/** The students whose requests Konselor sees: every one that is not removed. */
function visible(actor: AccountForAccess): SQL {
  return visibleTo(rowLimitForAction(actor, "manage_counselling_schedules"));
}

async function readCounts(
  db: Database,
  seen: SQL,
  today: string,
): Promise<ScheduleCounts> {
  const { status, day } = counsellingSchedules;
  const last = daysAfter(today, SOON_DAYS);
  const [counted] = await db
    .select({
      submitted: sql<number>`count(*) filter (where ${status} = 'submitted')::int`,
      scheduledSoon: sql<number>`count(*) filter (where ${status} = 'scheduled' and ${day} between ${today} and ${last})::int`,
      proposed: sql<number>`count(*) filter (where ${status} = 'proposed')::int`,
    })
    .from(counsellingSchedules)
    .innerJoin(students, OF_STUDENT)
    .where(seen);
  return counted ?? NONE;
}

async function countCards(db: Database, condition: SQL | undefined) {
  const [counted] = await db
    .select({ matching: count() })
    .from(counsellingSchedules)
    .innerJoin(students, OF_STUDENT)
    .where(condition);
  return counted?.matching ?? 0;
}

const counsellor = alias(accounts, "counsellor");

/** The requests with what their cards show, without their steps. */
function selectCardRows(db: Database) {
  return db
    .select({
      schedule: counsellingSchedules,
      name: students.name,
      nim: students.nim,
      program: studyPrograms.name,
      counsellorName: counsellor.name,
    })
    .from(counsellingSchedules)
    .innerJoin(students, OF_STUDENT)
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .leftJoin(counsellor, eq(counsellor.id, counsellingSchedules.counsellorId));
}

type CardRow = Awaited<ReturnType<typeof selectCardRows>>[number];

/** The steps of the requests, oldest first, by request. */
async function readSteps(
  db: Database,
  ids: string[],
): Promise<Map<string, ScheduleStepView[]>> {
  const steps = new Map<string, ScheduleStepView[]>();
  if (ids.length === 0) return steps;
  const rows = await db
    .select({
      id: counsellingScheduleChanges.id,
      scheduleId: counsellingScheduleChanges.scheduleId,
      at: counsellingScheduleChanges.changedAt,
      by: accounts.name,
      step: counsellingScheduleChanges.step,
    })
    .from(counsellingScheduleChanges)
    .innerJoin(accounts, eq(accounts.id, counsellingScheduleChanges.changedBy))
    .where(inArray(counsellingScheduleChanges.scheduleId, ids))
    .orderBy(
      asc(counsellingScheduleChanges.changedAt),
      asc(counsellingScheduleChanges.id),
    );
  for (const row of rows) {
    const { id, by, step } = row;
    const line = { id, at: shownMoment(row.at), by, step };
    steps.set(row.scheduleId, [...(steps.get(row.scheduleId) ?? []), line]);
  }
  return steps;
}

function cardOf(
  row: CardRow,
  steps: ScheduleStepView[],
): CounsellorScheduleCard {
  const { schedule } = row;
  return {
    id: schedule.id,
    name: row.name,
    nim: row.nim,
    program: row.program,
    status: schedule.status,
    topic: schedule.topic,
    day: schedule.day,
    hour: schedule.hour,
    way: schedule.way,
    story: schedule.story,
    reason: schedule.reason,
    counsellorName: row.counsellorName,
    steps,
    version: versionOf(schedule.changedAt),
  };
}

/** The cards of these rows, with their steps read in one go. */
async function cardsOf(
  db: Database,
  rows: CardRow[],
): Promise<CounsellorScheduleCard[]> {
  const steps = await readSteps(
    db,
    rows.map((row) => row.schedule.id),
  );
  return rows.map((row) => cardOf(row, steps.get(row.schedule.id) ?? []));
}

/**
 * "Jadwal konseling" of Konselor: the numbers above the cards, and one
 * page of the cards that match the Status filter, Diajukan first and
 * then by the time each is about. Every request of a student who is not
 * removed. A fixed number of reads, however many requests there are.
 * Nothing for an account without the right.
 */
export async function readScheduleBoard(
  db: Database,
  actor: AccountForAccess,
  params: ScheduleListParams,
  now: Date = new Date(),
): Promise<ScheduleBoard | null> {
  if (!may(actor.roles, "manage_counselling_schedules")) return null;
  const seen = visible(actor);
  const statuses = statusesOf(params.filter);
  const condition = and(
    seen,
    statuses ? inArray(counsellingSchedules.status, statuses) : undefined,
  );
  const [counts, matching] = await Promise.all([
    readCounts(db, seen, campusDay(now)),
    countCards(db, condition),
  ]);
  const page = pageWithin(params.page, matching, SCHEDULES_PAGE_SIZE);
  const rows = await selectCardRows(db)
    .where(condition)
    .orderBy(
      STATUS_ORDER,
      asc(counsellingSchedules.day),
      asc(counsellingSchedules.hour),
      asc(counsellingSchedules.id),
    )
    .limit(SCHEDULES_PAGE_SIZE)
    .offset((page - 1) * SCHEDULES_PAGE_SIZE);
  return { counts, cards: await cardsOf(db, rows), matching, page };
}
