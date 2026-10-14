import {
  and,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  lt,
  lte,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { type CampusMoment, campusTime } from "@/academic-periods/campus-clock";
import { campusDay } from "@/academic-periods/campus-day";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import {
  dormActivityVersions,
  dormAttendanceCounts,
  dormAttendanceMarks,
  students,
} from "@/db/schema";
import { hourAndMinute } from "@/db/stored-time";
import type { DormId } from "@/dorms/dorms";
import { audiencesCovering } from "./activity-audience";
import { readVersions } from "./activity-reads";
import {
  historyWithClarifications,
  tallyWithClarifications,
} from "./clarification-effect";
import {
  type ClarifiedEntry,
  clarificationCell,
  waitingCount,
} from "./clarification-time";
import {
  type HeldActivity,
  type HistoryEntry,
  heldKey,
  historyOf,
  marksOver,
  pastOccurrences,
  type Tally,
  type TimedMark,
  tallyOf,
} from "./history";
import {
  type CoveredOwnMarks,
  coveredOwnMarks,
  historyWithLeave,
  tallyWithLeave,
} from "./history-leave";
import type { ApprovedLeave } from "./leave-marks";
import { readApprovedLeaves } from "./leave-store";
import {
  readOwnAccepted,
  readOwnClarifications,
  readOwnStatuses,
} from "./own-clarifications";
import { readStudentDorm } from "./student-dorm";

/** How many activities Riwayat shows. */
export const HISTORY_SHOWN = 25;

/** The attendance of a resident at the dorm activities. */
export interface OwnAttendance {
  /** Of the announced counts that hold them: Hadir and Tidak hadir. */
  present: number;
  absent: number;
  /** The last activities that are over, the latest first. */
  history: ClarifiedEntry[];
  /** "Klarifikasi aktif": the resident's clarifications that wait. */
  waitingClarifications: number;
}

export type OwnAttendanceAnswer =
  | { kind: "refused" }
  | { kind: "shown"; attendance: OwnAttendance };

const ANNOUNCED = isNotNull(dormAttendanceCounts.announcedAt);

/**
 * How often the student was Hadir and Tidak hadir in announced counts of
 * the days before `today`, whose activities are all over.
 */
async function readTotalsBefore(
  db: Database,
  studentId: string,
  today: string,
): Promise<Tally> {
  const rows = await db
    .select({ isAbsent: dormAttendanceMarks.isAbsent, times: count() })
    .from(dormAttendanceMarks)
    .innerJoin(
      dormAttendanceCounts,
      eq(dormAttendanceCounts.id, dormAttendanceMarks.countId),
    )
    .where(
      and(
        eq(dormAttendanceMarks.studentId, studentId),
        ANNOUNCED,
        lt(dormAttendanceCounts.day, today),
      ),
    )
    .groupBy(dormAttendanceMarks.isAbsent);
  const timesOf = (isAbsent: boolean) =>
    rows.find((row) => row.isAbsent === isAbsent)?.times ?? 0;
  return { present: timesOf(false), absent: timesOf(true) };
}

/**
 * The student's own marks in announced counts of the days `days` picks,
 * the latest first, each with the name and hours its activity had on its
 * day, also an activity removed since.
 */
async function readOwnMarks(
  db: Database,
  studentId: string,
  days: SQL | undefined,
  limit?: number,
): Promise<TimedMark[]> {
  const query = db
    .select({
      activityId: dormAttendanceCounts.activityId,
      day: dormAttendanceCounts.day,
      name: dormActivityVersions.name,
      startTime: dormActivityVersions.startTime,
      endTime: dormActivityVersions.endTime,
      isAbsent: dormAttendanceMarks.isAbsent,
      note: dormAttendanceMarks.note,
    })
    .from(dormAttendanceMarks)
    .innerJoin(
      dormAttendanceCounts,
      eq(dormAttendanceCounts.id, dormAttendanceMarks.countId),
    )
    .innerJoin(
      dormActivityVersions,
      and(
        eq(dormActivityVersions.activityId, dormAttendanceCounts.activityId),
        or(
          isNull(dormActivityVersions.shownFrom),
          lte(dormActivityVersions.shownFrom, dormAttendanceCounts.day),
        ),
        or(
          isNull(dormActivityVersions.shownUntil),
          gte(dormActivityVersions.shownUntil, dormAttendanceCounts.day),
        ),
      ),
    )
    .where(and(eq(dormAttendanceMarks.studentId, studentId), ANNOUNCED, days))
    .orderBy(
      desc(dormAttendanceCounts.day),
      desc(dormActivityVersions.startTime),
    );
  const rows = await (limit === undefined ? query : query.limit(limit));
  return rows.map((row) => ({
    ...row,
    startTime: hourAndMinute(row.startTime),
    endTime: hourAndMinute(row.endTime),
  }));
}

/** The activities of the dorm's residents that are over, the latest first. */
async function readHeld(
  db: Database,
  dorm: DormId,
  now: CampusMoment,
): Promise<HeldActivity[]> {
  const rows = await readVersions(
    db,
    and(
      inArray(dormActivityVersions.audience, audiencesCovering(dorm)),
      lte(dormActivityVersions.startsOn, now.day),
    ),
  );
  return pastOccurrences(rows, now, HISTORY_SHOWN).map(({ day, activity }) => ({
    activityId: activity.id,
    day,
    name: activity.name,
    startTime: activity.startTime,
  }));
}

/** The keys of those of the activities whose count is announced. */
async function readAnnouncedKeys(
  db: Database,
  held: HeldActivity[],
): Promise<Set<string>> {
  if (held.length === 0) return new Set();
  const days = held.map((activity) => activity.day).sort();
  const rows = await db
    .select({
      activityId: dormAttendanceCounts.activityId,
      day: dormAttendanceCounts.day,
    })
    .from(dormAttendanceCounts)
    .where(
      and(
        ANNOUNCED,
        inArray(
          dormAttendanceCounts.activityId,
          held.map((activity) => activity.activityId),
        ),
        sql`${dormAttendanceCounts.day} between ${days[0]} and ${days.at(-1)}`,
      ),
    );
  return new Set(rows.map(heldKey));
}

/**
 * The attendance of a resident at the dorm activities: how often they
 * were Hadir and Tidak hadir in the announced counts, and Riwayat of the
 * last 25 activities of their group that are over, with their
 * clarifications; approved leave and an accepted clarification make them
 * Izin or Hadir. Only the account's own
 * student is ever read. Refused for an account without the right, and
 * for a student who lives in no dorm today.
 */
export async function readOwnAttendance(
  db: Database,
  account: Pick<Account, "roles" | "studentId">,
  moment: Date,
): Promise<OwnAttendanceAnswer> {
  if (!may(account.roles, "view_own_dorm_attendance")) {
    return { kind: "refused" };
  }
  const { studentId } = account;
  if (studentId === null) return { kind: "refused" };
  const now = { day: campusDay(moment), time: campusTime(moment) };
  const dorm = await readStudentDorm(db, studentId, now.day);
  if (dorm === null) return { kind: "refused" };

  const before = lt(dormAttendanceCounts.day, now.day);
  const [earlier, todays, past, held] = await Promise.all([
    readTotalsBefore(db, studentId, now.day),
    readOwnMarks(db, studentId, eq(dormAttendanceCounts.day, now.day)),
    readOwnMarks(db, studentId, before, HISTORY_SHOWN),
    readHeld(db, dorm, now),
  ]);
  // An activity announced while it still runs counts only once it is over.
  const overToday = marksOver(todays, now);
  const today = tallyOf(overToday);
  const totals = {
    present: earlier.present + today.present,
    absent: earlier.absent + today.absent,
  };
  const marks = [...overToday, ...marksOver(past, now)];
  const [announced, covered, accepted] = await Promise.all([
    readAnnouncedKeys(db, held),
    readCoveredMarks(db, studentId, moment, now),
    readOwnAccepted(db, studentId),
  ]);
  const history = historyOf(held, marks, announced, HISTORY_SHOWN);
  const withClarifications = historyWithClarifications(
    historyWithLeave(history, covered),
    new Map(accepted.map((each) => [each.key, each])),
  );
  const [clarified, statuses] = await Promise.all([
    clarifiedHistory(db, studentId, withClarifications, now.day),
    readOwnStatuses(db, studentId),
  ]);
  const tally = tallyWithClarifications(
    tallyWithLeave(totals, covered),
    accepted,
    new Set(covered.keys()),
  );
  return {
    kind: "shown",
    attendance: {
      ...tally,
      history: clarified,
      waitingClarifications: waitingCount(statuses),
    },
  };
}

/** Riwayat with what the Klarifikasi cell of each row shows `today`. */
async function clarifiedHistory(
  db: Database,
  studentId: string,
  history: HistoryEntry[],
  today: string,
): Promise<ClarifiedEntry[]> {
  const oldest = history.at(-1);
  if (oldest === undefined) return [];
  const shown = await readOwnClarifications(db, studentId, oldest.day);
  return history.map((entry) => ({
    ...entry,
    clarification: clarificationCell({
      status: entry.status,
      day: entry.day,
      today,
      newest: shown.get(heldKey(entry)) ?? null,
    }),
  }));
}

/** The days on campus from the first to the last day of each leave. */
function daysOfLeaves(leaves: ApprovedLeave[]): SQL | undefined {
  return or(
    ...leaves.map((leave) =>
      and(
        gte(dormAttendanceCounts.day, campusDay(leave.start)),
        lte(dormAttendanceCounts.day, campusDay(leave.end)),
      ),
    ),
  );
}

/**
 * The student's own announced marks, of activities over at a moment,
 * that an approved leave of theirs covers. Only the days of their leave
 * are read.
 */
async function readCoveredMarks(
  db: Database,
  studentId: string,
  moment: Date,
  now: CampusMoment,
): Promise<CoveredOwnMarks> {
  const leaves = await readApprovedLeaves(
    db,
    { start: new Date(0), end: moment },
    eq(students.id, studentId),
  );
  if (leaves.length === 0) return new Map();
  const marks = await readOwnMarks(db, studentId, daysOfLeaves(leaves));
  return coveredOwnMarks(marks, leaves, studentId, now);
}
