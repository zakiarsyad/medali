import { daysAfter } from "@/academic-periods/days-after";
import type {
  SharingContent,
  SharingStatus,
  SharingStep,
} from "@/features/counselling/sharing-ids";
import { sharingAfter, wayOf } from "@/features/counselling/sharing-rules";
import type { Database } from "./connect";
import {
  isStudentSharingStep,
  SAMPLE_SHARINGS,
  type SampleSharing,
} from "./sample-counselling-sharings";
import { counsellingSharingChanges, counsellingSharings } from "./schema";
import { counsellorId, studentOf } from "./seed-counselling-consents";
import { momentOf } from "./seed-siku-adjustments";

interface SampleChange {
  step: SharingStep;
  by: string;
  at: Date;
  before: SharingStatus | null;
  after: SharingStatus;
}

function changesOf(
  sample: SampleSharing,
  people: { counsellor: string; student: string },
  today: string,
  now: Date,
): SampleChange[] {
  const changes: SampleChange[] = [];
  let before: SharingStatus | null = null;
  for (const { step, daysAgo } of sample.steps) {
    const after = sharingAfter(step, before);
    if (after === null) {
      throw new Error("A sample sharing takes a step refused.");
    }
    const by = isStudentSharingStep({ step, daysAgo })
      ? people.student
      : people.counsellor;
    const at = momentOf(daysAfter(today, -daysAgo), now);
    changes.push({ step, by, at, before, after });
    before = after;
  }
  return changes;
}

function rowOf(
  sample: SampleSharing,
  studentId: string,
  changes: SampleChange[],
) {
  const first = changes[0];
  const last = changes.at(-1);
  if (!first || !last) throw new Error("A sample sharing has no step.");
  const answer = changes.find(
    (change) => wayOf(change.step) !== null || change.step === "decline",
  );
  const publish = changes.find((change) => change.step === "publish");
  return {
    studentId,
    status: last.after,
    data: sample.data,
    recipients: sample.recipients,
    summary: sample.summary,
    way: answer ? wayOf(answer.step) : null,
    askedBy: first.by,
    askedAt: first.at,
    answeredAt: answer?.at ?? null,
    publishedBy: publish?.by ?? null,
    publishedAt: publish?.at ?? null,
    changedBy: last.by,
    changedAt: last.at,
  };
}

/**
 * Adds the sample sharings of counselling data, each with a log line for
 * every step of it, as the work of the sample Konselor or of the
 * student. The sample students, consents and sessions must be there
 * already. `today` is today on campus.
 */
export async function addSampleCounsellingSharings(
  db: Database,
  today: string,
  now: Date = new Date(),
): Promise<void> {
  const counsellor = await counsellorId(db);
  for (const sample of SAMPLE_SHARINGS) {
    const student = await studentOf(db, sample.nim);
    const people = { counsellor, student: student.accountId };
    const changes = changesOf(sample, people, today, now);
    const [sharing] = await db
      .insert(counsellingSharings)
      .values(rowOf(sample, student.id, changes))
      .returning({ id: counsellingSharings.id });
    if (!sharing) throw new Error("A sample sharing was not added.");
    const shared: SharingContent = {
      data: sample.data,
      recipients: sample.recipients,
      summary: sample.summary,
    };
    await db.insert(counsellingSharingChanges).values(
      changes.map((change) => ({
        sharingId: sharing.id,
        changedBy: change.by,
        changedAt: change.at,
        step: change.step,
        statusBefore: change.before,
        statusAfter: change.after,
        shared,
      })),
    );
  }
}
