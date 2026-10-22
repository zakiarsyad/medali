// Sample Tahun akademik of this file: those of the app's sample data.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import { SAMPLE_COACHING_STATUSES } from "./sample-coaching-statuses";
import {
  coachingStatusChanges,
  coachingStatuses,
  mentorGroupMembers,
  mentorGroupMentors,
  students,
} from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

// Loading the whole sample set takes seconds when every check runs at
// once, so everything is checked on one load.
describe("the sample coaching statuses", { timeout: 20_000 }, () => {
  it("are kept by today at the latest, each with its log line, a mentee's moved by their own mentor", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);
      const today = campusDay();
      const kept = await db
        .select({
          nim: students.nim,
          studentId: coachingStatuses.studentId,
          status: coachingStatuses.status,
          note: coachingStatuses.note,
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
        const mentors = await db
          .select({ id: mentorGroupMentors.mentorId })
          .from(mentorGroupMembers)
          .innerJoin(
            mentorGroupMentors,
            eq(mentorGroupMentors.groupId, mentorGroupMembers.groupId),
          )
          .where(eq(mentorGroupMembers.studentId, row?.studentId ?? ""));
        expect(mentors.map((mentor) => mentor.id)).toContain(row?.changedBy);
      }
    });
  });
});
