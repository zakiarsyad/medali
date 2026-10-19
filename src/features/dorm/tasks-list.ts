import { and, asc, count, eq, type SQL } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import type { Action } from "@/auth/roles";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import {
  dormLeaves,
  dormReturnReports,
  dormRoomPlaces,
  dormRooms,
  students,
} from "@/db/schema";
import { readDormCohorts } from "@/dorms/dorm-cohorts";
import type { DormId } from "@/dorms/dorms";
import { dormInSql, isPlaceRoomOf } from "@/dorms/resident-condition";
import { shownMoment } from "@/ui/day";
import { countWaitingAppeals } from "./appeal-inbox";
import { roomWords } from "./leave-list";
import { purposeWords } from "./leave-row";
import { outLateAt } from "./return-conditions";
import { lateMinutes } from "./return-rules";
import {
  type ClarificationTask,
  type CleaningTask,
  type DormTasks,
  type LeaveTask,
  type ReturnTask,
  TASKS_SHOWN,
  type TaskSection,
  type WarningTask,
} from "./tasks-card";
import {
  countPassedOn,
  readClarificationSection,
} from "./tasks-clarifications";
import { countJudgedDuties, readCleaningSection } from "./tasks-cleaning";
import {
  countDueForLetter,
  othersThan,
  readWarningSection,
} from "./tasks-warnings";

const WAITING_LEAVE = eq(dormLeaves.status, "submitted");
const VERIFIED_REPORT = eq(dormReturnReports.status, "verified");

/** The students an account may see through an action, or null without it. */
function visibleThrough(account: AccountForAccess, action: Action): SQL | null {
  if (!may(account.roles, action)) return null;
  return visibleTo(rowLimitForAction(account, action));
}

async function countLeaves(db: Database, condition: SQL | undefined) {
  const [counted] = await db
    .select({ total: count() })
    .from(dormLeaves)
    .innerJoin(students, eq(students.id, dormLeaves.studentId))
    .where(condition);
  return counted?.total ?? 0;
}

async function countReports(db: Database, visible: SQL) {
  const [counted] = await db
    .select({ total: count() })
    .from(dormReturnReports)
    .innerJoin(dormLeaves, eq(dormLeaves.id, dormReturnReports.leaveId))
    .innerJoin(students, eq(students.id, dormLeaves.studentId))
    .where(and(visible, VERIFIED_REPORT));
  return counted?.total ?? 0;
}

/** The room of a student today, by the dorm the database works out. */
function roomOn(dorm: SQL<DormId | null>) {
  return and(eq(dormRooms.id, dormRoomPlaces.roomId), isPlaceRoomOf(dorm));
}

function readWaitingLeaves(
  db: Database,
  visible: SQL,
  dorm: SQL<DormId | null>,
) {
  return db
    .select({
      id: dormLeaves.id,
      kind: dormLeaves.kind,
      startsAt: dormLeaves.startsAt,
      endsAt: dormLeaves.endsAt,
      specialReason: dormLeaves.specialReason,
      purpose: dormLeaves.purpose,
      destination: dormLeaves.destination,
      name: students.name,
      nim: students.nim,
      dorm,
      room: dormRooms.number,
    })
    .from(dormLeaves)
    .innerJoin(students, eq(students.id, dormLeaves.studentId))
    .leftJoin(dormRoomPlaces, eq(dormRoomPlaces.studentId, students.id))
    .leftJoin(dormRooms, roomOn(dorm))
    .where(and(visible, WAITING_LEAVE))
    .orderBy(asc(dormLeaves.startsAt), asc(dormLeaves.id))
    .limit(TASKS_SHOWN);
}

type WaitingLeaveRow = Awaited<ReturnType<typeof readWaitingLeaves>>[number];

export function leaveTaskOf(row: WaitingLeaveRow, now: Date): LeaveTask {
  return {
    id: row.id,
    name: row.name,
    nim: row.nim,
    room: roomWords(row.dorm, row.room),
    kind: row.kind,
    start: shownMoment(row.startsAt),
    end: shownMoment(row.endsAt),
    purpose: purposeWords(row),
    destination: row.destination,
    startPassed: row.startsAt < now,
  };
}

function readVerifiedReports(
  db: Database,
  visible: SQL,
  dorm: SQL<DormId | null>,
) {
  return db
    .select({
      reportId: dormReturnReports.id,
      sentAt: dormReturnReports.sentAt,
      photoKey: dormReturnReports.photoKey,
      verifyNote: dormReturnReports.verifyNote,
      kind: dormLeaves.kind,
      endsAt: dormLeaves.endsAt,
      name: students.name,
      nim: students.nim,
      dorm,
      room: dormRooms.number,
    })
    .from(dormReturnReports)
    .innerJoin(dormLeaves, eq(dormLeaves.id, dormReturnReports.leaveId))
    .innerJoin(students, eq(students.id, dormLeaves.studentId))
    .leftJoin(dormRoomPlaces, eq(dormRoomPlaces.studentId, students.id))
    .leftJoin(dormRooms, roomOn(dorm))
    .where(and(visible, VERIFIED_REPORT))
    .orderBy(asc(dormReturnReports.sentAt), asc(dormReturnReports.id))
    .limit(TASKS_SHOWN);
}

type VerifiedReportRow = Awaited<
  ReturnType<typeof readVerifiedReports>
>[number];

export function returnTaskOf(row: VerifiedReportRow): ReturnTask {
  return {
    reportId: row.reportId,
    name: row.name,
    nim: row.nim,
    room: roomWords(row.dorm, row.room),
    kind: row.kind,
    deadline: shownMoment(row.endsAt),
    reportedAt: shownMoment(row.sentAt),
    lateMinutes: lateMinutes(row.sentAt, row.endsAt),
    bamNote: row.verifyNote,
    hasPhoto: row.photoKey !== null,
  };
}

async function readLeaveSection(
  db: Database,
  visible: SQL | null,
  dorm: SQL<DormId | null>,
  now: Date,
): Promise<TaskSection<LeaveTask> | null> {
  if (visible === null) return null;
  const [rows, total] = await Promise.all([
    readWaitingLeaves(db, visible, dorm),
    countLeaves(db, and(visible, WAITING_LEAVE)),
  ]);
  return { items: rows.map((row) => leaveTaskOf(row, now)), total };
}

async function readReturnSection(
  db: Database,
  visible: SQL | null,
  dorm: SQL<DormId | null>,
): Promise<TaskSection<ReturnTask> | null> {
  if (visible === null) return null;
  const [rows, total] = await Promise.all([
    readVerifiedReports(db, visible, dorm),
    countReports(db, visible),
  ]);
  return { items: rows.map(returnTaskOf), total };
}

async function countOutLate(
  db: Database,
  visible: SQL | null,
  now: Date,
): Promise<number | null> {
  if (visible === null) return null;
  return countLeaves(db, and(visible, outLateAt(now)));
}

function readClarifications(
  db: Database,
  account: AccountForAccess,
  dorm: SQL<DormId | null>,
): Promise<TaskSection<ClarificationTask>> | null {
  const visible = visibleThrough(account, "decide_dorm_clarification");
  if (visible === null) return null;
  const mayOpenFiles = may(account.roles, "open_dorm_clarification_files");
  return readClarificationSection(db, visible, dorm, mayOpenFiles);
}

function readCleaning(
  db: Database,
  account: AccountForAccess,
): Promise<TaskSection<CleaningTask>> | null {
  if (!may(account.roles, "validate_dorm_cleaning")) return null;
  return readCleaningSection(db);
}

/** The students whose SP an account may set, or null when it sets none. */
function dueVisibleTo(account: AccountForAccess): SQL | null {
  const visible = visibleThrough(account, "issue_dorm_warning_letters");
  if (visible === null) return null;
  return othersThan(visible, account.studentId);
}

function readWarnings(
  db: Database,
  account: AccountForAccess,
  dorm: SQL<DormId | null>,
  now: Date,
): Promise<TaskSection<WarningTask>> | null {
  const visible = dueVisibleTo(account);
  if (visible === null) return null;
  return readWarningSection(db, visible, dorm, now);
}

function countAppeals(
  db: Database,
  account: AccountForAccess,
): Promise<number> | null {
  const visible = visibleThrough(account, "view_dorm_violations");
  if (visible === null) return null;
  return countWaitingAppeals(db, visible);
}

/**
 * What waits for an account on Tugas saya, among the students it may see
 * through each right: the leave requests that wait, the earliest start
 * first, when it may decide them; the reports of a return that BAM -
 * BPHK verified, the earliest sent first, when it may validate them; the
 * clarifications BAM passed on, the earliest sent first, when it may
 * decide them; the cleaning duties BAM assessed, of every dorm, the
 * earliest date first, when it may validate them; the students due for
 * an SP, the highest SP first, when it may issue SPs; how many residents
 * are still out past their return time, when it may see leave; and how
 * many advokasi wait for BAM, when it may see Pelanggaran. Each section
 * holds its first items only, with how many wait in all. A fixed number
 * of reads, however many wait.
 */
export async function readDormTasks(
  db: Database,
  account: AccountForAccess,
  now: Date,
): Promise<DormTasks> {
  const dormCohorts = await readDormCohorts(db, campusDay(now));
  const dorm = dormInSql(dormCohorts ?? []);
  const [
    leaves,
    returns,
    clarifications,
    cleaning,
    warnings,
    outLate,
    waitingAppeals,
  ] = await Promise.all([
    readLeaveSection(
      db,
      visibleThrough(account, "decide_dorm_leave"),
      dorm,
      now,
    ),
    readReturnSection(
      db,
      visibleThrough(account, "validate_dorm_return"),
      dorm,
    ),
    readClarifications(db, account, dorm),
    readCleaning(db, account),
    readWarnings(db, account, dorm, now),
    countOutLate(db, visibleThrough(account, "view_dorm_leave"), now),
    countAppeals(db, account),
  ]);
  return {
    leaves,
    returns,
    clarifications,
    cleaning,
    warnings,
    outLate,
    waitingAppeals,
  };
}

/**
 * The number beside Tugas saya in the menu: how many items wait for a
 * decision this account may make at `now`. Five counts at most, and none
 * for an account that decides nothing here. Perlu dipantau is no
 * decision, so it does not count.
 */
export async function countDormTasks(
  db: Database,
  account: AccountForAccess,
  now: Date,
): Promise<number> {
  const leaveVisible = visibleThrough(account, "decide_dorm_leave");
  const reportVisible = visibleThrough(account, "validate_dorm_return");
  const clarificationVisible = visibleThrough(
    account,
    "decide_dorm_clarification",
  );
  const dueVisible = dueVisibleTo(account);
  const counts = await Promise.all([
    leaveVisible === null
      ? 0
      : countLeaves(db, and(leaveVisible, WAITING_LEAVE)),
    reportVisible === null ? 0 : countReports(db, reportVisible),
    clarificationVisible === null ? 0 : countPassedOn(db, clarificationVisible),
    may(account.roles, "validate_dorm_cleaning") ? countJudgedDuties(db) : 0,
    dueVisible === null ? 0 : countDueForLetter(db, dueVisible, now),
  ]);
  let total = 0;
  for (const counted of counts) total += counted;
  return total;
}
