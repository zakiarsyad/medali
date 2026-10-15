import {
  and,
  count,
  eq,
  gte,
  inArray,
  isNotNull,
  lte,
  type SQL,
  sql,
} from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  dormAttendanceCounts,
  dormAttendanceMarks,
  dormClarifications,
  students,
} from "@/db/schema";
import { dormInSql } from "@/dorms/resident-condition";
import type { AcceptedAs } from "./clarification-ids";
import type {
  ActivityLine,
  AnnouncedCount,
  DaysShown,
} from "./dashboard-lines";
import {
  type Changed,
  changesOf,
  type MarkGroup,
  markKey,
  type ParticipantMark,
} from "./dashboard-tally";
import type { HeldTimes } from "./leave-marks";
import { readApprovedLeaves, spanOfDay } from "./leave-store";

/** The marks of announced counts, added up, and the participants whose mark changes. */
export interface CountMarks {
  groups: MarkGroup[];
  changed: Changed[];
}

/** The announced counts of the days shown. A draft counts for no one. */
export function readAnnouncedCounts(
  db: Database,
  days: DaysShown,
): Promise<AnnouncedCount[]> {
  return db
    .select({
      id: dormAttendanceCounts.id,
      activityId: dormAttendanceCounts.activityId,
      day: dormAttendanceCounts.day,
    })
    .from(dormAttendanceCounts)
    .where(
      and(
        gte(dormAttendanceCounts.day, days.first),
        lte(dormAttendanceCounts.day, days.last),
        isNotNull(dormAttendanceCounts.announcedAt),
      ),
    );
}

/** The marks of the counts and of each visible student's dorm today, added up by the database. */
function readGroups(
  db: Database,
  countIds: string[],
  visible: SQL,
  dorm: ReturnType<typeof dormInSql>,
): Promise<MarkGroup[]> {
  return (
    db
      .select({
        countId: dormAttendanceMarks.countId,
        dorm,
        isAbsent: dormAttendanceMarks.isAbsent,
        students: count(),
      })
      .from(dormAttendanceMarks)
      .innerJoin(students, eq(students.id, dormAttendanceMarks.studentId))
      .where(and(inArray(dormAttendanceMarks.countId, countIds), visible))
      // By their places in the list: the dorm rule holds values of its
      // own, so the database would not take it written a second time.
      .groupBy(sql`1, 2, 3`)
  );
}

/** The marks in the counts of the visible students `which` picks. */
function readParticipantMarks(
  db: Database,
  countIds: string[],
  visible: SQL,
  dorm: ReturnType<typeof dormInSql>,
  which: SQL,
): Promise<ParticipantMark[]> {
  return db
    .select({
      countId: dormAttendanceMarks.countId,
      studentId: dormAttendanceMarks.studentId,
      dorm,
      isAbsent: dormAttendanceMarks.isAbsent,
    })
    .from(dormAttendanceMarks)
    .innerJoin(students, eq(students.id, dormAttendanceMarks.studentId))
    .where(and(inArray(dormAttendanceMarks.countId, countIds), visible, which));
}

interface Accepted {
  countId: string;
  studentId: string;
  acceptedAs: AcceptedAs;
}

/** What the accepted clarifications of the visible students in the counts made of them. */
async function readAccepted(
  db: Database,
  countIds: string[],
  visible: SQL,
): Promise<Accepted[]> {
  const rows = await db
    .select({
      countId: dormClarifications.countId,
      studentId: dormClarifications.studentId,
      acceptedAs: dormClarifications.acceptedAs,
    })
    .from(dormClarifications)
    .innerJoin(students, eq(students.id, dormClarifications.studentId))
    .where(
      and(
        inArray(dormClarifications.countId, countIds),
        eq(dormClarifications.status, "accepted"),
        visible,
      ),
    );
  const accepted: Accepted[] = [];
  for (const { acceptedAs, ...row } of rows) {
    if (acceptedAs !== null) accepted.push({ ...row, acceptedAs });
  }
  return accepted;
}

function acceptedByMark(accepted: Accepted[]): Map<string, AcceptedAs> {
  const byMark = new Map<string, AcceptedAs>();
  for (const { countId, studentId, acceptedAs } of accepted) {
    byMark.set(markKey(countId, studentId), acceptedAs);
  }
  return byMark;
}

/** The time each announced line's activity had on its day, by the id of its count. */
function heldOf(lines: ActivityLine[]): Map<string, HeldTimes> {
  const held = new Map<string, HeldTimes>();
  for (const { countId, day, activity } of lines) {
    if (countId === null) continue;
    held.set(countId, { day, ...activity });
  }
  return held;
}

/** The marks of those with approved leave, and of those with an accepted clarification. */
async function readChanged(
  db: Database,
  lines: ActivityLine[],
  days: DaysShown,
  visible: SQL,
  dorm: ReturnType<typeof dormInSql>,
): Promise<Changed[]> {
  const held = heldOf(lines);
  const countIds = [...held.keys()];
  const span = {
    start: spanOfDay(days.first).start,
    end: spanOfDay(days.last).end,
  };
  const [leaves, accepted] = await Promise.all([
    readApprovedLeaves(db, span, visible),
    readAccepted(db, countIds, visible),
  ]);
  const ids = new Set([
    ...leaves.map((leave) => leave.studentId),
    ...accepted.map((each) => each.studentId),
  ]);
  if (ids.size === 0) return [];
  const marks = await readParticipantMarks(
    db,
    countIds,
    visible,
    dorm,
    inArray(students.id, [...ids]),
  );
  return changesOf(marks, held, leaves, acceptedByMark(accepted));
}

/**
 * The announced counts of the lines among the students `visible` holds,
 * each participant by the dorm they live in today: the marks added up by
 * the database, and the participants whose mark approved leave or an
 * accepted clarification changes. A fixed number of reads, however many
 * activities there are.
 */
export async function readCountMarks(
  db: Database,
  lines: ActivityLine[],
  days: DaysShown,
  visible: SQL,
  dormCohorts: number[],
): Promise<CountMarks> {
  const announced = lines.filter((line) => line.countId !== null);
  if (announced.length === 0) return { groups: [], changed: [] };
  const dorm = dormInSql(dormCohorts);
  const countIds = [...heldOf(announced).keys()];
  const [groups, changed] = await Promise.all([
    readGroups(db, countIds, visible, dorm),
    readChanged(db, announced, days, visible, dorm),
  ]);
  return { groups, changed };
}
