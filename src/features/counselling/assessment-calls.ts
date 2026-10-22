import { and, desc, eq, inArray, type SQL, sql } from "drizzle-orm";
import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { campusDay } from "@/academic-periods/campus-day";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Scores } from "@/character-scores/assessment-score";
import { listedForCoaching } from "@/character-scores/coaching-listed";
import { coachingNeedOf } from "@/character-scores/coaching-need";
import { latestAssessments } from "@/character-scores/latest-assessments";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import {
  counsellingScheduleChanges,
  counsellingSchedules,
  students,
} from "@/db/schema";
import type {
  CounsellingHour,
  ScheduleStatus,
} from "@/mental-health/schedule-ids";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import { callReason, showsCallTime } from "./assessment-call-rules";
import {
  ALREADY_CALLED,
  CALL_NOT_ALLOWED_WORDS,
  callSent,
  NO_RUNNING_PERIOD,
  NOT_LISTED,
} from "./assessment-call-words";
import { lockStudent } from "./register-counselling";

const RIGHT = "call_counselling_from_assessment";

/** What "Panggil konseling" gives back: nothing is saved on a refusal. */
export type CallOutcome =
  | { kind: "kept"; done: string }
  | { kind: "refused"; error: string };

const NOT_ALLOWED: CallOutcome = {
  kind: "refused",
  error: CALL_NOT_ALLOWED_WORDS,
};

const NOT_LISTED_OUTCOME: CallOutcome = { kind: "refused", error: NOT_LISTED };

/**
 * The calls from Asesmen karakter made in the running period: since it
 * started, on campus. The running period is the one that started last,
 * so no later period can hold a call.
 */
function callsInPeriod(period: Pick<AcademicPeriod, "startsOn">): SQL {
  const callDay = sql`(${counsellingSchedules.createdAt} at time zone 'Asia/Jakarta')::date`;
  return sql`${counsellingSchedules.kind} = 'called' and ${callDay} >= ${period.startsOn}`;
}

async function hasCallInPeriod(
  tx: Database,
  studentId: string,
  period: Pick<AcademicPeriod, "startsOn">,
): Promise<boolean> {
  const [found] = await tx
    .select({ id: counsellingSchedules.id })
    .from(counsellingSchedules)
    .where(
      and(eq(counsellingSchedules.studentId, studentId), callsInPeriod(period)),
    )
    .limit(1);
  return found !== undefined;
}

interface ListedStudent {
  name: string;
  scores: Scores;
}

/**
 * The student, with their latest scores, when the account may call them
 * and they are listed now: Aktif, and their latest assessment is low.
 */
async function readListed(
  tx: Database,
  actor: AccountForAccess,
  studentId: string,
): Promise<ListedStudent | null> {
  const latest = latestAssessments(tx);
  const [found] = await tx
    .select({
      name: students.name,
      M: latest.scoreM,
      E: latest.scoreE,
      D: latest.scoreD,
      A: latest.scoreA,
      L: latest.scoreL,
      I: latest.scoreI,
    })
    .from(students)
    .innerJoin(latest, eq(latest.studentId, students.id))
    .where(
      and(
        eq(students.id, studentId),
        visibleTo(rowLimitForAction(actor, RIGHT)),
        ACTIVE_MEMBER,
        listedForCoaching(latest),
      ),
    );
  if (!found) return null;
  const { name, ...scores } = found;
  return { name, scores };
}

async function addCall(
  tx: Database,
  actorId: string,
  studentId: string,
  reason: string,
  now: Date,
): Promise<void> {
  const [added] = await tx
    .insert(counsellingSchedules)
    .values({
      studentId,
      kind: "called",
      status: "awaiting",
      basis: reason,
      createdAt: now,
      changedBy: actorId,
      changedAt: now,
    })
    .returning({ id: counsellingSchedules.id });
  if (!added) throw new Error("The call was not added.");
  await tx.insert(counsellingScheduleChanges).values({
    scheduleId: added.id,
    changedBy: actorId,
    changedAt: now,
    step: "call",
    statusBefore: null,
    statusAfter: "awaiting",
  });
}

/**
 * "Panggil konseling" of Penilai Mahasiswa: a Pemanggilan for Konselor,
 * Menunggu jadwal, with the reason as its Dasar, and its log line. One
 * per student in the running period, whatever its status; a voluntary
 * request does not count. Refused, saving nothing, without the right,
 * for a student who is not listed now, or while no period runs. Two
 * presses at once give one call: the student is locked, so the second
 * waits and then finds the first.
 */
export async function callFromAssessment(
  db: Database,
  actor: AccountForAccess,
  studentId: string,
  now: Date = new Date(),
): Promise<CallOutcome> {
  if (!may(actor.roles, RIGHT)) return NOT_ALLOWED;
  if (!isUuid(studentId)) return NOT_LISTED_OUTCOME;
  const period = await readRunningPeriod(db, campusDay(now));
  if (period === null) return { kind: "refused", error: NO_RUNNING_PERIOD };
  return db.transaction(async (tx) => {
    if (!(await lockStudent(tx, studentId))) return NOT_LISTED_OUTCOME;
    const listed = await readListed(tx, actor, studentId);
    const need = listed === null ? null : coachingNeedOf(listed.scores);
    if (listed === null || need === null) return NOT_LISTED_OUTCOME;
    if (await hasCallInPeriod(tx, studentId, period)) {
      return { kind: "refused", error: ALREADY_CALLED };
    }
    const reason = callReason(listed.scores, need);
    await addCall(tx, actor.id, studentId, reason, now);
    return { kind: "kept", done: callSent(listed.name) };
  });
}

/** How a call from Asesmen karakter stands, as its row shows it. */
export interface AssessmentCall {
  status: ScheduleStatus;
  /** The date and Jam Konselor set; none before, or while another is asked. */
  day: string | null;
  hour: CounsellingHour | null;
}

/**
 * The call of the running period of each of these students who has one,
 * the latest when there are more. Null, reading nothing, for an account
 * without the right: nobody else is told whether a student was called.
 */
export async function readAssessmentCalls(
  db: Database,
  actor: AccountForAccess,
  studentIds: readonly string[],
  today: string = campusDay(),
): Promise<Map<string, AssessmentCall> | null> {
  if (!may(actor.roles, RIGHT)) return null;
  const calls = new Map<string, AssessmentCall>();
  if (studentIds.length === 0) return calls;
  const period = await readRunningPeriod(db, today);
  if (period === null) return calls;
  const found = await db
    .select({
      studentId: counsellingSchedules.studentId,
      status: counsellingSchedules.status,
      day: counsellingSchedules.day,
      hour: counsellingSchedules.hour,
    })
    .from(counsellingSchedules)
    .where(
      and(
        inArray(counsellingSchedules.studentId, [...studentIds]),
        callsInPeriod(period),
      ),
    )
    .orderBy(desc(counsellingSchedules.createdAt));
  for (const { studentId, status, day, hour } of found) {
    if (calls.has(studentId)) continue;
    const timeShown = showsCallTime(status);
    calls.set(studentId, {
      status,
      day: timeShown ? day : null,
      hour: timeShown ? hour : null,
    });
  }
  return calls;
}
