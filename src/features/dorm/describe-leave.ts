import { campusDay } from "@/academic-periods/campus-day";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { type CoveredActivity, coveredActivities } from "./leave-cover";
import { LEAVE_KINDS, LEAVE_MAX_DAYS } from "./leave-ids";
import { type LeaveNote, leaveNote } from "./leave-note";
import type { LeaveTimes } from "./leave-rules";
import { overlapsOwn, readActivityRows } from "./leave-store";
import { hoursBetween, momentOf } from "./leave-time";
import { readStudentDorm } from "./student-dorm";

/** The kind and the times the form holds, as text. */
export interface SentTimes {
  kind: string;
  startsAt: string;
  endsAt: string;
}

const MAX_HOURS = LEAVE_MAX_DAYS * 24;

function timesOf(sent: SentTimes): LeaveTimes | null {
  const kind = LEAVE_KINDS.find((each) => each === sent.kind);
  const start = momentOf(sent.startsAt);
  const end = momentOf(sent.endsAt);
  if (kind === undefined || start === null || end === null) return null;
  return { kind, start, end };
}

/**
 * The dorm activities an ITMK of these times covers, looked for only in
 * times the rules may let through; null for any other kind.
 */
async function coveredBy(
  db: Database,
  studentId: string,
  times: LeaveTimes,
  today: string,
): Promise<CoveredActivity[] | null> {
  if (times.kind !== "skip_activities") return null;
  const hours = hoursBetween(times.start, times.end);
  if (hours <= 0 || hours > MAX_HOURS) return null;
  const dorm = await readStudentDorm(db, studentId, today);
  if (dorm === null) return null;
  const firstDay = campusDay(times.start);
  const lastDay = campusDay(times.end);
  const rows = await readActivityRows(db, [dorm], firstDay, lastDay);
  return coveredActivities(rows, dorm, times);
}

/**
 * The note under the times of the leave form of the actor's own student,
 * at a moment. Null while the kind or a time is not filled in, and for
 * an account that may not ask for leave.
 */
export async function describeLeave(
  db: Database,
  actor: Pick<Account, "roles" | "studentId">,
  sent: SentTimes,
  moment: Date = new Date(),
): Promise<LeaveNote | null> {
  if (!may(actor.roles, "ask_dorm_leave")) return null;
  const { studentId } = actor;
  if (studentId === null) return null;
  const times = timesOf(sent);
  if (times === null) return null;
  const [covered, overlaps] = await Promise.all([
    coveredBy(db, studentId, times, campusDay(moment)),
    times.end > times.start ? overlapsOwn(db, studentId, times) : false,
  ]);
  return leaveNote(times, moment, covered, overlaps);
}
