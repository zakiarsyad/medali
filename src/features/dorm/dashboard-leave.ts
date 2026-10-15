import { and, asc, count, eq, gte, lt, type SQL, sql } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import type { Database } from "@/db/connect";
import { dormLeaves, dormRoomPlaces, dormRooms, students } from "@/db/schema";
import { dormInSql } from "@/dorms/resident-condition";
import { monthOf } from "./dashboard-month";
import { LEAVE_KINDS, type LeaveKind } from "./leave-ids";
import { countWhere, roomWords } from "./leave-list";
import { outAt, outLateAt } from "./return-conditions";
import { isLateReturn } from "./return-rules";

/** The numbers of leave on Dashboard asrama. */
export interface LeaveNumbers {
  /** Sedang di luar asrama, as "Sedang di luar" on Perizinan asrama. */
  out: number;
  /** Those of them out past their return time. */
  outLate: number;
  /** Izin menunggu verifikasi, as "Menunggu verifikasi" on Perizinan asrama. */
  waiting: number;
}

/** The numbers of leave at a moment, among the students `visible` holds. */
export async function readLeaveNumbers(
  db: Database,
  visible: SQL,
  now: Date,
): Promise<LeaveNumbers> {
  const [out, outLate, waiting] = await Promise.all([
    countWhere(db, and(visible, outAt(now))),
    countWhere(db, and(visible, outLateAt(now))),
    countWhere(db, and(visible, eq(dormLeaves.status, "submitted"))),
  ]);
  return { out, outLate, waiting };
}

/** Perizinan bulan ini: the requests of each kind. */
export type LeaveByKind = Record<LeaveKind, number>;

/**
 * The requests whose start falls in the campus month of a moment, in
 * every status, of each kind, among the students `visible` holds.
 */
export async function readMonthLeave(
  db: Database,
  visible: SQL,
  now: Date,
): Promise<LeaveByKind> {
  const month = monthOf(campusDay(now));
  const rows = await db
    .select({ kind: dormLeaves.kind, requests: count() })
    .from(dormLeaves)
    .innerJoin(students, eq(students.id, dormLeaves.studentId))
    .where(
      and(
        visible,
        gte(dormLeaves.startsAt, month.start),
        lt(dormLeaves.startsAt, month.end),
      ),
    )
    .groupBy(dormLeaves.kind);
  const byKind: LeaveByKind = { outing: 0, skip_activities: 0, special: 0 };
  for (const kind of LEAVE_KINDS) {
    byKind[kind] = rows.find((row) => row.kind === kind)?.requests ?? 0;
  }
  return byKind;
}

/** How many residents out of the dorm the list shows at most. */
export const OUT_SHOWN = 20;

/** A resident out of the dorm now, as the list under "Sedang di luar asrama" shows them. */
export interface OutResident {
  leaveId: string;
  name: string;
  kind: LeaveKind;
  /** When they are due back. */
  endsAt: Date;
  /** Tujuan; empty when none was given. */
  destination: string;
  /** Where they live today, as a card of Perizinan asrama says it. */
  room: string;
  isLate: boolean;
}

/** The residents out of the dorm now, the soonest return first, and whether there are more. */
export interface OutList {
  residents: OutResident[];
  hasMore: boolean;
}

/**
 * Those out of the dorm at a moment, among the students `visible` holds,
 * with their kind of leave, return time, Tujuan and room: at most
 * `OUT_SHOWN`, the soonest return first. `dormCohorts` tells the dorm each
 * lives in today.
 */
export async function readOutList(
  db: Database,
  visible: SQL,
  now: Date,
  dormCohorts: number[],
): Promise<OutList> {
  const dorm = dormInSql(dormCohorts);
  const rows = await db
    .select({
      leaveId: dormLeaves.id,
      name: students.name,
      kind: dormLeaves.kind,
      status: dormLeaves.status,
      startsAt: dormLeaves.startsAt,
      endsAt: dormLeaves.endsAt,
      returnedAt: dormLeaves.returnedAt,
      destination: dormLeaves.destination,
      dorm,
      room: dormRooms.number,
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
    .where(and(visible, outAt(now)))
    .orderBy(asc(dormLeaves.endsAt), asc(dormLeaves.id))
    // One more than is shown, to tell whether there are more.
    .limit(OUT_SHOWN + 1);
  const residents = rows.slice(0, OUT_SHOWN).map((row) => ({
    leaveId: row.leaveId,
    name: row.name,
    kind: row.kind,
    endsAt: row.endsAt,
    destination: row.destination,
    room: roomWords(row.dorm, row.room),
    // Out now, so no report of their return waits.
    isLate: isLateReturn(row, null, now),
  }));
  return { residents, hasMore: rows.length > OUT_SHOWN };
}
