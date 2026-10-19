import { daysAfter } from "@/academic-periods/days-after";
import { weekdayFrom } from "@/academic-periods/weekdays";
import type { Database } from "./connect";
import {
  isStudentScheduleStep,
  SAMPLE_SCHEDULES,
  type SampleSchedule,
} from "./sample-counselling-schedules";
import { counsellingScheduleChanges, counsellingSchedules } from "./schema";
import { counsellorId, studentOf } from "./seed-counselling-consents";
import { momentOf } from "./seed-siku-adjustments";

function hasCounsellor(sample: SampleSchedule): boolean {
  return sample.steps.some((step) => !isStudentScheduleStep(step.step));
}

/**
 * Adds the sample requests for counselling, each with a log line for
 * every step of it, as the work of the student or of the sample
 * Konselor. The sample students, accounts and consents must be there
 * already. `today` is today on campus.
 */
export async function addSampleCounsellingSchedules(
  db: Database,
  today: string,
  now: Date = new Date(),
): Promise<void> {
  const counsellor = await counsellorId(db);
  for (const sample of SAMPLE_SCHEDULES) {
    const student = await studentOf(db, sample.nim);
    const changes = sample.steps.map((step) => ({
      step,
      by: isStudentScheduleStep(step.step) ? student.accountId : counsellor,
      at: momentOf(daysAfter(today, -step.daysAgo), now),
    }));
    const [first] = changes;
    const last = changes.at(-1);
    if (!first || !last) throw new Error("A sample request has no step.");
    const [schedule] = await db
      .insert(counsellingSchedules)
      .values({
        studentId: student.id,
        kind: "voluntary",
        status: last.step.statusAfter,
        topic: sample.topic,
        day: weekdayFrom(daysAfter(today, sample.inDays)),
        hour: sample.hour,
        way: sample.way,
        story: sample.story,
        counsellorMessage: sample.counsellorMessage,
        reason: sample.reason,
        counsellorId: hasCounsellor(sample) ? counsellor : null,
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
}
