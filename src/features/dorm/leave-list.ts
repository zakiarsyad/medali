import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
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
import { shownMoment } from "@/ui/day";
import { pageWithin } from "@/ui/list-pages";
import type { ActivityRow } from "./activity-row";
import {
  LEAVE_CARDS_PAGE_SIZE,
  type LeaveFilters,
  type StatusChoice,
} from "./leave-address";
import { type LeaveCard, type ReturnWords, warningsOf } from "./leave-card";
import { coveredActivities } from "./leave-cover";
import { APPROVED_STATUSES } from "./leave-ids";
import { rowOfLeave } from "./leave-row";
import { readActivityRows } from "./leave-store";
import { campusTimeOf } from "./leave-time";
import { type ReportCard, reportCardOf } from "./return-card";
import { lateAt, outAt, REPORT_WAITING } from "./return-conditions";
import {
  isLateReturn,
  isOpenReport,
  isOut,
  timelinessOf,
} from "./return-rules";
import { type LatestStoredReport, readLatestReports } from "./return-store";

/** The numbers above the list. */
export interface LeaveCounts {
  /** Menunggu verifikasi: the requests that wait. */
  waiting: number;
  /** Laporan kembali menunggu: reports of a return that wait for a check. */
  waitingReports: number;
  /** Sedang di luar: residents out on leave now. */
  out: number;
  /** Terlambat kembali: leave late now, those already back among them. */
  late: number;
  /** Izin 30 hari terakhir: approved, Selesai or not, starting in the last 30 days. */
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
  /** The moment it was read, as a time on campus such as 2026-10-14T16:20. */
  asOf: string;
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
  const [waiting, waitingReports, out, late, recentApproved] =
    await Promise.all([
      countWhere(db, and(visible, eq(dormLeaves.status, "submitted"))),
      countWhere(db, and(visible, REPORT_WAITING)),
      countWhere(db, and(visible, outAt(now))),
      countWhere(db, and(visible, lateAt(now))),
      countWhere(
        db,
        and(
          visible,
          inArray(dormLeaves.status, APPROVED_STATUSES),
          gte(dormLeaves.startsAt, since),
          lte(dormLeaves.startsAt, now),
        ),
      ),
    ]);
  return { waiting, waitingReports, out, late, recentApproved };
}

function ofStudentFound(query: string): SQL | undefined {
  if (query === "") return undefined;
  const pattern = containsPattern(query);
  return or(ilike(students.name, pattern), ilike(students.nim, pattern));
}

/** The leave a status choice narrows the list to, at a moment. */
function ofStatus(status: StatusChoice, now: Date): SQL | undefined {
  switch (status) {
    case "all":
      return undefined;
    case "reports":
      return REPORT_WAITING;
    case "out":
      return outAt(now);
    case "late":
      return lateAt(now);
    default:
      return eq(dormLeaves.status, status);
  }
}

function matching(
  filters: LeaveFilters,
  visible: SQL,
  now: Date,
): SQL | undefined {
  const { status, kind, query } = filters;
  return and(
    visible,
    ofStatus(status, now),
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

const recorder = alias(accounts, "recorder");

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
      recordedBy: recorder.name,
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
    .leftJoin(recorder, eq(recorder.id, dormLeaves.returnRecordedBy))
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

function reportOf(
  stored: LatestStoredReport | undefined,
  endsAt: Date,
): ReportCard | null {
  if (stored === undefined) return null;
  return reportCardOf(stored.report, stored, endsAt);
}

function returnedOf(row: PageRow): ReturnWords | null {
  const { returnedAt, returnRecordedBy, endsAt } = row.leave;
  if (returnedAt === null) return null;
  return {
    at: shownMoment(returnedAt),
    timeliness: timelinessOf(returnedAt, endsAt),
    recordedBy: returnRecordedBy === null ? null : (row.recordedBy ?? "-"),
  };
}

function cardOf(
  row: PageRow,
  activities: ActivityRow[],
  reports: Map<string, LatestStoredReport>,
  now: Date,
): LeaveCard {
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
  const latest = reports.get(leave.id);
  const waiting = isOpenReport(latest?.report ?? null) ? latest : undefined;
  return {
    ...rowOfLeave(leave, covered),
    name: row.name,
    nim: row.nim,
    room: roomWords(dorm, row.room),
    decision,
    warnings: warningsOf({ ...leave, ...span }, now),
    report: reportOf(latest, leave.endsAt),
    isOut: isOut(leave, waiting !== undefined, now),
    isLate: isLateReturn(leave, waiting?.report ?? null, now),
    returned: returnedOf(row),
  };
}

/**
 * Perizinan asrama as staff see it, among the students `visible` holds:
 * for Ketua Program Studi those of their own program only. The numbers
 * above the list, and one page of the
 * cards that match the filters, each with where the student lives today,
 * for ITMK the activities of their dorm it covers, and for the other
 * kinds the latest report of a return with who checked it. A fixed number
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
  const condition = matching(filters, visible, now);
  const [counts, total, dormCohorts] = await Promise.all([
    readCounts(db, visible, now),
    countWhere(db, condition),
    readDormCohorts(db, campusDay(now)),
  ]);
  const shownPage = pageWithin(page, total, LEAVE_CARDS_PAGE_SIZE);
  const dorm = dormInSql(dormCohorts ?? []);
  const rows = await readPage(db, condition, filters, dorm, shownPage);
  const [activities, reports] = await Promise.all([
    readRowsFor(db, rows),
    readLatestReports(
      db,
      rows.map((row) => row.leave.id),
    ),
  ]);
  return {
    counts,
    list: {
      cards: rows.map((row) => cardOf(row, activities, reports, now)),
      matching: total,
      page: shownPage,
    },
    asOf: campusTimeOf(now),
  };
}
