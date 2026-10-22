import { and, eq, isNull } from "drizzle-orm";
import { daysAfter } from "@/academic-periods/days-after";
import { FIRST_COACHING_STATUS } from "@/character-scores/coaching-status";
import type { Database } from "./connect";
import {
  SAMPLE_COACHING_STATUSES,
  type SampleCoachingStatus,
} from "./sample-coaching-statuses";
import {
  coachingStatusChanges,
  coachingStatuses,
  mentorGroupMembers,
  mentorGroupMentors,
} from "./schema";
import { studentOf } from "./seed-counselling-consents";
import { momentOf, sampleAccountOf } from "./seed-siku-adjustments";

/** The account of the mentor who holds a student's group today. */
async function mentorOf(db: Database, studentId: string): Promise<string> {
  const [found] = await db
    .select({ id: mentorGroupMentors.mentorId })
    .from(mentorGroupMembers)
    .innerJoin(
      mentorGroupMentors,
      eq(mentorGroupMentors.groupId, mentorGroupMembers.groupId),
    )
    .where(
      and(
        eq(mentorGroupMembers.studentId, studentId),
        isNull(mentorGroupMentors.endsOn),
      ),
    )
    .limit(1);
  if (!found) throw new Error("A sample mentee has no mentor today.");
  return found.id;
}

async function changerOf(
  db: Database,
  sample: SampleCoachingStatus,
  studentId: string,
): Promise<string> {
  if (sample.changedAs === "mentor") return mentorOf(db, studentId);
  return sampleAccountOf(db, "head_of_unit");
}

/**
 * Adds the sample coaching statuses, each with the log line of its one
 * change from Teridentifikasi, as the work of the sample Kepala Unit or
 * of the student's own Pengasuh. The sample students, accounts, groups
 * and assessments must be there already. `today` is today on campus.
 */
export async function addSampleCoachingStatuses(
  db: Database,
  today: string,
  now: Date = new Date(),
): Promise<void> {
  for (const sample of SAMPLE_COACHING_STATUSES) {
    const student = await studentOf(db, sample.nim);
    const changedBy = await changerOf(db, sample, student.id);
    const changedAt = momentOf(daysAfter(today, -sample.daysAgo), now);
    const { status, note } = sample;
    await db.insert(coachingStatuses).values({
      studentId: student.id,
      status,
      note,
      changedBy,
      changedAt,
    });
    await db.insert(coachingStatusChanges).values({
      studentId: student.id,
      statusBefore: FIRST_COACHING_STATUS,
      noteBefore: "",
      statusAfter: status,
      noteAfter: note,
      changedBy,
      changedAt,
    });
  }
}
