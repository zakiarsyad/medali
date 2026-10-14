import {
  and,
  asc,
  count,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  lte,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  accounts,
  dormActivityVersions,
  dormAttendanceCounts,
  dormAttendanceMarks,
  dormClarifications,
  students,
} from "@/db/schema";
import { hourAndMinute } from "@/db/stored-time";
import {
  type CoveredParticipant,
  type DayAttendance,
  withLeave,
} from "./announced-attendance";
import {
  type AcceptedParticipant,
  attendanceWithClarifications,
} from "./clarification-effect";
import { type ApprovedLeave, type HeldTimes, leaveMarkOf } from "./leave-marks";
import { readApprovedLeaves, spanOfDay } from "./leave-store";

/**
 * The announced counts of a day, with who announced them and the hours
 * their activity had that day, also an activity removed since.
 */
async function readAnnounced(db: Database, day: string) {
  const rows = await db
    .select({
      id: dormAttendanceCounts.id,
      activityId: dormAttendanceCounts.activityId,
      announcedAt: dormAttendanceCounts.announcedAt,
      announcedBy: accounts.name,
      startTime: dormActivityVersions.startTime,
      endTime: dormActivityVersions.endTime,
    })
    .from(dormAttendanceCounts)
    .innerJoin(accounts, eq(accounts.id, dormAttendanceCounts.announcedBy))
    .innerJoin(
      dormActivityVersions,
      and(
        eq(dormActivityVersions.activityId, dormAttendanceCounts.activityId),
        or(
          isNull(dormActivityVersions.shownFrom),
          lte(dormActivityVersions.shownFrom, day),
        ),
        or(
          isNull(dormActivityVersions.shownUntil),
          gte(dormActivityVersions.shownUntil, day),
        ),
      ),
    )
    .where(
      and(
        eq(dormAttendanceCounts.day, day),
        isNotNull(dormAttendanceCounts.announcedAt),
      ),
    );
  return rows.map((row) => ({
    ...row,
    startTime: hourAndMinute(row.startTime),
    endTime: hourAndMinute(row.endTime),
  }));
}

type Announced = Awaited<ReturnType<typeof readAnnounced>>[number];

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

/** The marks of the counts, by name, of the visible students `which` picks. */
function readMarks(
  db: Database,
  countIds: string[],
  visible: SQL,
  which: SQL | undefined,
) {
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
    .where(and(inArray(dormAttendanceMarks.countId, countIds), visible, which))
    .orderBy(asc(students.name), asc(students.nim));
}

const ABSENT_OR_NOTED = or(
  dormAttendanceMarks.isAbsent,
  sql`${dormAttendanceMarks.note} <> ''`,
);

type Total = Awaited<ReturnType<typeof readTotals>>[number];
type Mark = Awaited<ReturnType<typeof readMarks>>[number];

function totalOf(totals: Total[], countId: string, isAbsent: boolean): number {
  const found = totals.find(
    (row) => row.countId === countId && row.isAbsent === isAbsent,
  );
  return found?.students ?? 0;
}

/**
 * The visible participants of each count whose approved leave covers its
 * activity, by the id of the count. Only the students with approved
 * leave on the day are read.
 */
async function readCovered(
  db: Database,
  announced: Announced[],
  day: string,
  visible: SQL,
): Promise<Map<string, CoveredParticipant[]>> {
  const covered = new Map<string, CoveredParticipant[]>();
  const leaves = await readApprovedLeaves(db, spanOfDay(day), visible);
  if (leaves.length === 0) return covered;
  const ids = [...new Set(leaves.map((leave) => leave.studentId))];
  const countIds = announced.map((counted) => counted.id);
  const marks = await readMarks(
    db,
    countIds,
    visible,
    inArray(students.id, ids),
  );
  for (const counted of announced) {
    const held = { day, ...counted };
    const ofCount = marks.filter((mark) => mark.countId === counted.id);
    covered.set(counted.id, coveredAt(ofCount, leaves, held));
  }
  return covered;
}

function coveredAt(
  marks: Mark[],
  leaves: ApprovedLeave[],
  held: HeldTimes,
): CoveredParticipant[] {
  const covered: CoveredParticipant[] = [];
  for (const { countId: _countId, ...mark } of marks) {
    const leaveMark = leaveMarkOf(leaves, mark.studentId, held);
    if (leaveMark !== null) covered.push({ ...mark, mark: leaveMark });
  }
  return covered;
}

/**
 * The accepted clarifications of the visible students in the counts,
 * each with their mark as the count keeps it now.
 */
async function readAccepted(
  db: Database,
  countIds: string[],
  visible: SQL,
): Promise<(AcceptedParticipant & { countId: string })[]> {
  const rows = await db
    .select({
      countId: dormClarifications.countId,
      studentId: students.id,
      name: students.name,
      nim: students.nim,
      isAbsent: dormAttendanceMarks.isAbsent,
      note: dormAttendanceMarks.note,
      acceptedAs: dormClarifications.acceptedAs,
      reason: dormClarifications.reason,
    })
    .from(dormClarifications)
    .innerJoin(students, eq(students.id, dormClarifications.studentId))
    .innerJoin(
      dormAttendanceMarks,
      and(
        eq(dormAttendanceMarks.countId, dormClarifications.countId),
        eq(dormAttendanceMarks.studentId, dormClarifications.studentId),
      ),
    )
    .where(
      and(
        inArray(dormClarifications.countId, countIds),
        eq(dormClarifications.status, "accepted"),
        visible,
      ),
    );
  const accepted: (AcceptedParticipant & { countId: string })[] = [];
  for (const { acceptedAs, ...row } of rows) {
    if (acceptedAs === null) continue;
    accepted.push({ ...row, acceptedAs, key: row.countId });
  }
  return accepted;
}

/**
 * The announced counts of a day, by the id of their activity, among the
 * students an account may see: Ketua Program Studi counts and lists only
 * the students of their own program. A draft is left out: until it is
 * announced it counts for no one. A count stays when its activity is
 * removed later. Approved leave that covers an activity decides how its
 * students count, also leave approved after the announcement: Izin is
 * neither Hadir nor Tidak hadir, and ITMK is Hadir. Where no leave covers
 * a student, an accepted clarification makes them Hadir or Izin.
 */
export async function readDayAttendance(
  db: Database,
  day: string,
  visible: SQL,
): Promise<DayAttendance> {
  const announced = await readAnnounced(db, day);
  if (announced.length === 0) return {};
  const countIds = announced.map((counted) => counted.id);
  const [totals, marked, covered, accepted] = await Promise.all([
    readTotals(db, countIds, visible),
    readMarks(db, countIds, visible, ABSENT_OR_NOTED),
    readCovered(db, announced, day, visible),
    readAccepted(db, countIds, visible),
  ]);

  const attendance: DayAttendance = {};
  for (const counted of announced) {
    if (counted.announcedAt === null) continue;
    const kept = {
      announcedAt: counted.announcedAt,
      announcedBy: counted.announcedBy,
      present: totalOf(totals, counted.id, false),
      absent: totalOf(totals, counted.id, true),
      marked: marked
        .filter((row) => row.countId === counted.id)
        .map(({ countId: _countId, isAbsent, ...row }) => ({
          ...row,
          status: isAbsent ? ("absent" as const) : ("present" as const),
        })),
    };
    const coveredHere = covered.get(counted.id) ?? [];
    attendance[counted.activityId] = attendanceWithClarifications(
      withLeave(kept, coveredHere),
      accepted.filter((each) => each.countId === counted.id),
      new Set(coveredHere.map((each) => each.studentId)),
    );
  }
  return attendance;
}
