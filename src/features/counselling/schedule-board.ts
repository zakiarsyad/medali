import { and, asc, count, desc, eq, inArray, type SQL, sql } from "drizzle-orm";
import { type AnyPgColumn, alias } from "drizzle-orm/pg-core";
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
import {
  ACTIVE_STATUSES,
  type ScheduleKind,
  TO_SCHEDULE_STATUSES,
} from "./schedule-ids";
import { topicOf } from "./schedule-rules";
import type {
  CounsellorScheduleCard,
  ScheduleBoard,
  ScheduleCounts,
  ScheduleStepView,
} from "./schedule-view";

/** How many days ahead "Dijadwalkan 7 hari ke depan" looks. */
const SOON_DAYS = 7;

const OF_STUDENT = eq(students.id, counsellingSchedules.studentId);

const IS_ACTIVE = inArray(counsellingSchedules.status, [...ACTIVE_STATUSES]);

const NONE: ScheduleCounts = {
  toSchedule: 0,
  scheduledSoon: 0,
  proposed: 0,
  activeByKind: { voluntary: 0, assigned: 0, called: 0 },
};

/**
 * Minta jadwal ulang first, then Menunggu jadwal, Diajukan, Usulan
 * jadwal lain and Dijadwalkan, then the ones that are over: Selesai,
 * Tidak hadir and Dibatalkan together.
 */
const STATUS_ORDER = sql`case ${counsellingSchedules.status}
  when 'reschedule_asked' then 0 when 'awaiting' then 1
  when 'submitted' then 2 when 'proposed' then 3 when 'scheduled' then 4
  else 5 end`;

/** How many active ones of a Jenis, as one count of the numbers. */
function activeOf(kind: ScheduleKind) {
  return sql<number>`count(*) filter (where ${IS_ACTIVE} and ${counsellingSchedules.kind} = ${kind})::int`;
}

/** A column of an active request, and nothing for one that is over. */
function whileActive(column: SQL | AnyPgColumn): SQL {
  return sql`case when ${IS_ACTIVE} then ${column} end`;
}

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
  const toSchedule = inArray(status, [...TO_SCHEDULE_STATUSES]);
  const [counted] = await db
    .select({
      toSchedule: sql<number>`count(*) filter (where ${toSchedule})::int`,
      scheduledSoon: sql<number>`count(*) filter (where ${status} = 'scheduled' and ${day} between ${today} and ${last})::int`,
      proposed: sql<number>`count(*) filter (where ${status} = 'proposed')::int`,
      voluntary: activeOf("voluntary"),
      assigned: activeOf("assigned"),
      called: activeOf("called"),
    })
    .from(counsellingSchedules)
    .innerJoin(students, OF_STUDENT)
    .where(seen);
  if (!counted) return NONE;
  const { voluntary, assigned, called, ...counts } = counted;
  return { ...counts, activeByKind: { voluntary, assigned, called } };
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
    kind: schedule.kind,
    status: schedule.status,
    topic: topicOf(schedule.kind, schedule.topic),
    day: schedule.day,
    hour: schedule.hour,
    way: schedule.way,
    story: schedule.story,
    reason: schedule.reason,
    basis: schedule.basis,
    senderMessage: schedule.senderMessage,
    // A request sent back by the student waits for a Konselor again.
    counsellorName: schedule.status === "submitted" ? null : row.counsellorName,
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

/** The card of one request Konselor may see, or null when there is none. */
export async function readScheduleCard(
  db: Database,
  actor: AccountForAccess,
  id: string,
): Promise<CounsellorScheduleCard | null> {
  const rows = await selectCardRows(db).where(
    and(visible(actor), eq(counsellingSchedules.id, id)),
  );
  const [card] = await cardsOf(db, rows);
  return card ?? null;
}

/**
 * "Jadwal konseling" of Konselor: the numbers above the cards, and one
 * page of the cards that match the Status and Jenis filters, Minta
 * jadwal ulang first, then Menunggu jadwal and Diajukan, each by the
 * time it is about, and those over after them, the latest first. Every request of a student who is not removed. A fixed number
 * of reads, however many requests there are.
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
  const kind = params.kind ?? null;
  const condition = and(
    seen,
    statuses ? inArray(counsellingSchedules.status, statuses) : undefined,
    kind ? eq(counsellingSchedules.kind, kind) : undefined,
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
      asc(whileActive(counsellingSchedules.day)),
      asc(whileActive(counsellingSchedules.hour)),
      asc(whileActive(counsellingSchedules.createdAt)),
      // Those over have no time above, so the latest of them comes first.
      desc(counsellingSchedules.day),
      desc(counsellingSchedules.hour),
      asc(counsellingSchedules.id),
    )
    .limit(SCHEDULES_PAGE_SIZE)
    .offset((page - 1) * SCHEDULES_PAGE_SIZE);
  return { counts, cards: await cardsOf(db, rows), matching, page };
}
