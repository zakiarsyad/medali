import { eq } from "drizzle-orm";
import { daysAfter } from "@/academic-periods/days-after";
import { weekdayFrom } from "@/academic-periods/weekdays";
import type { AssignmentKind } from "@/features/counselling/schedule-ids";
import type { Database } from "./connect";
import {
  isSenderScheduleStep,
  isStudentScheduleStep,
  SAMPLE_ASSIGNMENTS,
  SAMPLE_SCHEDULES,
  type SampleAssignment,
  type SampleSchedule,
  type SampleScheduleStep,
} from "./sample-counselling-schedules";
import {
  counsellingScheduleChanges,
  counsellingSchedules,
  disciplinePenalties,
} from "./schema";
import { counsellorId, studentOf } from "./seed-counselling-consents";
import { momentOf, sampleAccountOf } from "./seed-siku-adjustments";

/** Who took the steps of one sample: the student, the sender and Konselor. */
interface Takers {
  student: string;
  sender: string | null;
  counsellor: string;
}

function takerOf(step: SampleScheduleStep, takers: Takers): string {
  if (isStudentScheduleStep(step.step)) return takers.student;
  if (isSenderScheduleStep(step.step) && takers.sender) return takers.sender;
  return takers.counsellor;
}

function hasCounsellor(steps: SampleScheduleStep[]): boolean {
  return steps.some(
    (step) =>
      !isStudentScheduleStep(step.step) && !isSenderScheduleStep(step.step),
  );
}

type ScheduleValues = Omit<
  typeof counsellingSchedules.$inferInsert,
  "status" | "counsellorId" | "createdAt" | "changedBy" | "changedAt"
>;

/**
 * Adds one sample request or assignment in its last status, with a log
 * line for every step of it.
 */
async function addSample(
  db: Database,
  values: ScheduleValues,
  steps: SampleScheduleStep[],
  takers: Takers,
  moment: { today: string; now: Date },
): Promise<void> {
  const changes = steps.map((step) => ({
    step,
    by: takerOf(step, takers),
    at: momentOf(daysAfter(moment.today, -step.daysAgo), moment.now),
  }));
  const [first] = changes;
  const last = changes.at(-1);
  if (!first || !last) throw new Error("A sample request has no step.");
  const [schedule] = await db
    .insert(counsellingSchedules)
    .values({
      ...values,
      status: last.step.statusAfter,
      counsellorId: hasCounsellor(steps) ? takers.counsellor : null,
      createdAt: first.at,
      changedBy: last.by,
      changedAt: last.at,
    })
    .returning({ id: counsellingSchedules.id });
  if (!schedule) throw new Error("A sample request was not added.");
  await db.insert(counsellingScheduleChanges).values(
    changes.map((change, place) => ({
      scheduleId: schedule.id,
      changedBy: change.by,
      changedAt: change.at,
      step: change.step.step,
      statusBefore: changes[place - 1]?.step.statusAfter ?? null,
      statusAfter: change.step.statusAfter,
    })),
  );
}

function voluntaryValues(
  sample: SampleSchedule,
  studentId: string,
  today: string,
): ScheduleValues {
  return {
    studentId,
    kind: "voluntary",
    topic: sample.topic,
    day: weekdayFrom(daysAfter(today, sample.inDays)),
    hour: sample.hour,
    way: sample.way,
    story: sample.story,
    counsellorMessage: sample.counsellorMessage,
    reason: sample.reason,
  };
}

/** The key of the student's one sample discipline penalty. */
async function penaltyOf(db: Database, studentId: string): Promise<string> {
  const found = await db
    .select({ id: disciplinePenalties.id })
    .from(disciplinePenalties)
    .where(eq(disciplinePenalties.studentId, studentId));
  const [penalty, ...more] = found;
  if (!penalty || more.length > 0) {
    throw new Error("A sample Penugasan has no one penalty to be sent from.");
  }
  return penalty.id;
}

function assignmentValues(
  sample: SampleAssignment,
  studentId: string,
  penaltyId: string | null,
  today: string,
): ScheduleValues {
  const { time } = sample;
  return {
    studentId,
    penaltyId,
    kind: sample.kind,
    day: time ? weekdayFrom(daysAfter(today, time.inDays)) : null,
    hour: time?.hour ?? null,
    way: time?.way ?? null,
    basis: sample.basis,
    senderMessage: sample.senderMessage,
    counsellorMessage: sample.counsellorMessage,
    reason: sample.reason,
  };
}

/**
 * Adds the sample requests for counselling and the sample assignments,
 * each with a log line for every step of it, as the work of the student,
 * of the sample Konselor, or of the sample Pembina Disiplin Mahasiswa or
 * Penilai Mahasiswa who sent it. The sample students, accounts, consents
 * and discipline penalties must be there already. `today` is today on
 * campus.
 */
export async function addSampleCounsellingSchedules(
  db: Database,
  today: string,
  now: Date = new Date(),
): Promise<void> {
  const counsellor = await counsellorId(db);
  const moment = { today, now };
  for (const sample of SAMPLE_SCHEDULES) {
    const student = await studentOf(db, sample.nim);
    const takers = { student: student.accountId, sender: null, counsellor };
    const values = voluntaryValues(sample, student.id, today);
    await addSample(db, values, sample.steps, takers, moment);
  }
  const senders: Record<AssignmentKind, string> = {
    assigned: await sampleAccountOf(db, "discipline_officer"),
    called: await sampleAccountOf(db, "assessor"),
  };
  for (const sample of SAMPLE_ASSIGNMENTS) {
    const student = await studentOf(db, sample.nim);
    const sender = senders[sample.kind];
    const takers = { student: student.accountId, sender, counsellor };
    const penaltyId = sample.fromPenalty
      ? await penaltyOf(db, student.id)
      : null;
    const values = assignmentValues(sample, student.id, penaltyId, today);
    await addSample(db, values, sample.steps, takers, moment);
  }
}
