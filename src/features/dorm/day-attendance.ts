import {
  and,
  asc,
  count,
  eq,
  inArray,
  isNotNull,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  accounts,
  dormAttendanceCounts,
  dormAttendanceMarks,
  students,
} from "@/db/schema";
import type { DayAttendance } from "./announced-attendance";

/** The announced counts of a day, with who announced them. */
function readAnnounced(db: Database, day: string) {
  return db
    .select({
      id: dormAttendanceCounts.id,
      activityId: dormAttendanceCounts.activityId,
      announcedAt: dormAttendanceCounts.announcedAt,
      announcedBy: accounts.name,
    })
    .from(dormAttendanceCounts)
    .innerJoin(accounts, eq(accounts.id, dormAttendanceCounts.announcedBy))
    .where(
      and(
        eq(dormAttendanceCounts.day, day),
        isNotNull(dormAttendanceCounts.announcedAt),
      ),
    );
}

/** How many of the visible students were present and absent, by count. */
function readTotals(db: Database, countIds: string[], visible: SQL) {
  return db
    .select({
      countId: dormAttendanceMarks.countId,
      isAbsent: dormAttendanceMarks.isAbsent,
      students: count(),
    })
    .from(dormAttendanceMarks)
    .innerJoin(students, eq(students.id, dormAttendanceMarks.studentId))
    .where(and(inArray(dormAttendanceMarks.countId, countIds), visible))
    .groupBy(dormAttendanceMarks.countId, dormAttendanceMarks.isAbsent);
}

/** The visible students absent or with a note, by name. */
function readMarked(db: Database, countIds: string[], visible: SQL) {
  return db
    .select({
      countId: dormAttendanceMarks.countId,
      studentId: students.id,
      name: students.name,
      nim: students.nim,
      isAbsent: dormAttendanceMarks.isAbsent,
      note: dormAttendanceMarks.note,
    })
    .from(dormAttendanceMarks)
    .innerJoin(students, eq(students.id, dormAttendanceMarks.studentId))
    .where(
      and(
        inArray(dormAttendanceMarks.countId, countIds),
        or(
          dormAttendanceMarks.isAbsent,
          sql`${dormAttendanceMarks.note} <> ''`,
        ),
        visible,
      ),
    )
    .orderBy(asc(students.name), asc(students.nim));
}

/**
 * The announced counts of a day, by the id of their activity, among the
 * students an account may see: Ketua Program Studi counts and lists only
 * the students of their own program. A draft is left out: until it is
 * announced it counts for no one. A count stays when its activity is
 * removed later.
 */
export async function readDayAttendance(
  db: Database,
  day: string,
  visible: SQL,
): Promise<DayAttendance> {
  const announced = await readAnnounced(db, day);
  if (announced.length === 0) return {};
  const countIds = announced.map((counted) => counted.id);
  const [totals, marked] = await Promise.all([
    readTotals(db, countIds, visible),
    readMarked(db, countIds, visible),
  ]);

  const attendance: DayAttendance = {};
  for (const counted of announced) {
    if (counted.announcedAt === null) continue;
    attendance[counted.activityId] = {
      announcedAt: counted.announcedAt,
      announcedBy: counted.announcedBy,
      present: totalOf(totals, counted.id, false),
      absent: totalOf(totals, counted.id, true),
      marked: marked
        .filter((row) => row.countId === counted.id)
        .map(({ countId: _countId, ...row }) => row),
    };
  }
  return attendance;
}

type Total = Awaited<ReturnType<typeof readTotals>>[number];

function totalOf(totals: Total[], countId: string, isAbsent: boolean): number {
  const found = totals.find(
    (row) => row.countId === countId && row.isAbsent === isAbsent,
  );
  return found?.students ?? 0;
}
