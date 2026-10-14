import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import type { Database } from "@/db/connect";
import { containsPattern } from "@/db/contains-pattern";
import {
  accounts,
  dormLeaves,
  dormRoomPlaces,
  dormRooms,
  students,
} from "@/db/schema";
import { readDormCohorts } from "@/dorms/dorm-cohorts";
import { DORM_NAMES, type DormId } from "@/dorms/dorms";
import { dormInSql } from "@/dorms/resident-condition";
import { pageWithin } from "@/ui/list-pages";
import type { ActivityRow } from "./activity-row";
import { LEAVE_CARDS_PAGE_SIZE, type LeaveFilters } from "./leave-address";
import { type LeaveCard, warningsOf } from "./leave-card";
import { coveredActivities } from "./leave-cover";
import { rowOfLeave } from "./leave-row";
import { readActivityRows } from "./leave-store";

/** The two numbers above the list. */
export interface LeaveCounts {
  /** Menunggu verifikasi: the requests that wait. */
  waiting: number;
  /** Izin 30 hari terakhir: approved, starting in the last 30 days. */
  recentApproved: number;
}

/** One page of the cards, and how many match the filters in all. */
export interface LeaveList {
  cards: LeaveCard[];
  matching: number;
  /** The page shown: the one asked for, or the last one there is. */
  page: number;
}

export interface LeaveBoard {
  counts: LeaveCounts;
  list: LeaveList;
}

const DAYS_COUNTED = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

async function countWhere(db: Database, condition: SQL | undefined) {
  const [counted] = await db
    .select({ matching: count() })
    .from(dormLeaves)
    .innerJoin(students, eq(students.id, dormLeaves.studentId))
    .where(condition);
  return counted?.matching ?? 0;
}

async function readCounts(
  db: Database,
  visible: SQL,
  now: Date,
): Promise<LeaveCounts> {
  const since = new Date(now.getTime() - DAYS_COUNTED * DAY_MS);
  const [waiting, recentApproved] = await Promise.all([
    countWhere(db, and(visible, eq(dormLeaves.status, "submitted"))),
    countWhere(
      db,
      and(
        visible,
        eq(dormLeaves.status, "approved"),
        gte(dormLeaves.startsAt, since),
        lte(dormLeaves.startsAt, now),
      ),
    ),
  ]);
  return { waiting, recentApproved };
}

function ofStudentFound(query: string): SQL | undefined {
  if (query === "") return undefined;
  const pattern = containsPattern(query);
  return or(ilike(students.name, pattern), ilike(students.nim, pattern));
}

function matching(filters: LeaveFilters, visible: SQL): SQL | undefined {
  const { status, kind, query } = filters;
  return and(
    visible,
    status === "all" ? undefined : eq(dormLeaves.status, status),
    kind === "all" ? undefined : eq(dormLeaves.kind, kind),
    ofStudentFound(query),
  );
}

/**
 * Those that wait come soonest first, as they are decided in that order;
 * any other list the latest start first.
 */
function orderOf(filters: LeaveFilters) {
  if (filters.status === "submitted") {
    return [asc(dormLeaves.startsAt), asc(dormLeaves.id)];
  }
  return [desc(dormLeaves.startsAt), asc(dormLeaves.id)];
}

function readPage(
  db: Database,
  condition: SQL | undefined,
  filters: LeaveFilters,
  dorm: SQL<DormId | null>,
  page: number,
) {
  return db
    .select({
      leave: dormLeaves,
      name: students.name,
      nim: students.nim,
      dorm,
      room: dormRooms.number,
      decidedBy: accounts.name,
    })
    .from(dormLeaves)
    .innerJoin(students, eq(students.id, dormLeaves.studentId))
    .leftJoin(dormRoomPlaces, eq(dormRoomPlaces.studentId, students.id))
    .leftJoin(
      dormRooms,
      and(
        eq(dormRooms.id, dormRoomPlaces.roomId),
        sql`${dormRooms.dorm} = ${dorm}`,
      ),
    )
    .leftJoin(accounts, eq(accounts.id, dormLeaves.decidedBy))
    .where(condition)
    .orderBy(...orderOf(filters))
    .limit(LEAVE_CARDS_PAGE_SIZE)
    .offset((page - 1) * LEAVE_CARDS_PAGE_SIZE);
}

type PageRow = Awaited<ReturnType<typeof readPage>>[number];

function roomWords(dorm: DormId | null, room: string | null): string {
  if (dorm === null) return "Tidak tinggal di asrama";
  if (room === null) return `${DORM_NAMES[dorm]}, belum diplot`;
  return `${DORM_NAMES[dorm]}, kamar ${room}`;
}

/** The versions of the activities the ITMK requests of a page may cover. */
function readRowsFor(db: Database, rows: PageRow[]): Promise<ActivityRow[]> {
  const dorms = new Set<DormId>();
  const days: string[] = [];
  for (const { leave, dorm } of rows) {
    if (leave.kind !== "skip_activities" || dorm === null) continue;
    dorms.add(dorm);
    days.push(campusDay(leave.startsAt), campusDay(leave.endsAt));
  }
  days.sort();
  const [first] = days;
  const last = days.at(-1);
  if (first === undefined || last === undefined) return Promise.resolve([]);
  return readActivityRows(db, [...dorms], first, last);
}

function cardOf(row: PageRow, activities: ActivityRow[], now: Date): LeaveCard {
  const { leave, dorm } = row;
  const span = { start: leave.startsAt, end: leave.endsAt };
  const isSkipping = leave.kind === "skip_activities";
  const covered =
    isSkipping && dorm !== null
      ? coveredActivities(activities, dorm, span)
      : [];
  const decision =
    row.decidedBy === null
      ? null
      : { by: row.decidedBy, note: leave.decisionNote };
  return {
    ...rowOfLeave(leave, covered),
    name: row.name,
    nim: row.nim,
    room: roomWords(dorm, row.room),
    decision,
    warnings: warningsOf({ ...leave, ...span }, now),
  };
}

/**
 * Perizinan asrama as staff see it, among the students `visible` holds:
 * for Ketua Program Studi those of their own program only. The numbers
 * Menunggu verifikasi and Izin 30 hari terakhir, and one page of the
 * cards that match the filters, each with where the student lives today
 * and, for ITMK, the activities of their dorm it covers. A fixed number
 * of reads, however many requests there are. Whether the account may
 * read them is checked by the caller.
 */
export async function readLeaveBoard(
  db: Database,
  visible: SQL,
  filters: LeaveFilters,
  page: number,
  now: Date,
): Promise<LeaveBoard> {
  const condition = matching(filters, visible);
  const [counts, total, dormCohorts] = await Promise.all([
    readCounts(db, visible, now),
    countWhere(db, condition),
    readDormCohorts(db, campusDay(now)),
  ]);
  const shownPage = pageWithin(page, total, LEAVE_CARDS_PAGE_SIZE);
  const dorm = dormInSql(dormCohorts ?? []);
  const rows = await readPage(db, condition, filters, dorm, shownPage);
  const activities = await readRowsFor(db, rows);
  return {
    counts,
    list: {
      cards: rows.map((row) => cardOf(row, activities, now)),
      matching: total,
      page: shownPage,
    },
  };
}
