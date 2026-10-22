// Sample Tahun akademik of this file: those of the app's sample data.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import { runningPeriodOn } from "@/academic-periods/running-period";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import type { Database } from "./connect";
import { EARLIER, SAMPLE_ASSESSMENTS } from "./sample-character-assessments";
import { SAMPLE_COACHING_STATUSES } from "./sample-coaching-statuses";
import {
  characterAssessments,
  coachingStatusChanges,
  coachingStatuses,
  mentorGroupMembers,
  mentorGroupMentors,
  students,
} from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

async function expectAssessments(db: Database): Promise<void> {
  const now = new Date();
  const periods = await readAcademicPeriods(db);
  const running = runningPeriodOn(periods, campusDay(now));
  const rows = await db
    .select()
    .from(characterAssessments)
    .orderBy(characterAssessments.enteredAt);

  expect(rows).toHaveLength(SAMPLE_ASSESSMENTS.length);
  for (const [place, row] of rows.entries()) {
    expect(row.enteredAt.getTime()).toBeLessThanOrEqual(now.getTime());
    const sample = SAMPLE_ASSESSMENTS[place];
    if (sample && sample.daysAgo >= EARLIER) {
      expect(row.periodId).not.toBe(running?.id);
    }
  }
}

function mentorsOf(db: Database, studentId: string) {
  return db
    .select({ id: mentorGroupMentors.mentorId })
    .from(mentorGroupMembers)
    .innerJoin(
      mentorGroupMentors,
      eq(mentorGroupMentors.groupId, mentorGroupMembers.groupId),
    )
    .where(eq(mentorGroupMembers.studentId, studentId));
}

async function expectCoachingStatuses(db: Database): Promise<void> {
  const today = campusDay();
  const kept = await db
    .select({
      nim: students.nim,
      studentId: coachingStatuses.studentId,
      status: coachingStatuses.status,
      changedBy: coachingStatuses.changedBy,
      changedAt: coachingStatuses.changedAt,
    })
    .from(coachingStatuses)
    .innerJoin(students, eq(students.id, coachingStatuses.studentId));
  const lines = await db.select().from(coachingStatusChanges);

  expect(kept).toHaveLength(SAMPLE_COACHING_STATUSES.length);
  expect(lines).toHaveLength(kept.length);
  for (const sample of SAMPLE_COACHING_STATUSES) {
    const row = kept.find((each) => each.nim === sample.nim);
    expect(row?.status).toBe(sample.status);
    expect(campusDay(row?.changedAt) <= today).toBe(true);
    expect(lines).toContainEqual(
      expect.objectContaining({
        studentId: row?.studentId,
        statusBefore: "identified",
        noteBefore: "",
        statusAfter: sample.status,
        noteAfter: sample.note,
        changedBy: row?.changedBy,
      }),
    );
    if (sample.changedAs !== "mentor") continue;
    const mentors = await mentorsOf(db, row?.studentId ?? "");
    expect(mentors.map((mentor) => mentor.id)).toContain(row?.changedBy);
  }
}

// Loading the whole sample set takes seconds when every check runs at
// once, so everything is checked on one load: the coaching statuses
// too, which follow the assessments.
describe("the sample character assessments", { timeout: 20_000 }, () => {
  it("are all added before now, those made long ago in a period before the running one, and the coaching statuses after them, each with its log line, a mentee's moved by their own mentor", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);
      await expectAssessments(db);
      await expectCoachingStatuses(db);
    });
  });
});
