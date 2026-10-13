import { and, eq, isNull } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import {
  mentorGroupMembers,
  mentorGroupMentors,
  mentoringScoreChanges,
  mentoringScores,
  students,
} from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

// Loading the whole sample set takes seconds when every check runs at
// once, and it waits behind other checks that write the same tables.
describe("the sample mentoring scores", { timeout: 20_000 }, () => {
  it("are of the running period, for Aktif members of a group, given by a mentor of that group", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const running = await readRunningPeriod(db);
      const scores = await db
        .select({
          periodId: mentoringScores.periodId,
          scoredBy: mentoringScores.scoredBy,
          scoredAt: mentoringScores.scoredAt,
          status: students.status,
          groupId: mentorGroupMembers.groupId,
        })
        .from(mentoringScores)
        .innerJoin(students, eq(students.id, mentoringScores.studentId))
        .leftJoin(
          mentorGroupMembers,
          eq(mentorGroupMembers.studentId, mentoringScores.studentId),
        );
      const mentors = await db.select().from(mentorGroupMentors);

      expect(scores.length).toBeGreaterThan(0);
      for (const score of scores) {
        const ofGroup = mentors
          .filter((mentor) => mentor.groupId === score.groupId)
          .map((mentor) => mentor.mentorId);

        expect(score.periodId).toBe(running?.id);
        expect(score.status).toBe("active");
        expect(ofGroup).toContain(score.scoredBy);
        expect(score.scoredAt.getTime()).toBeLessThanOrEqual(Date.now());
      }
    });
  });

  it("leave some mentees of a group that has a mentor without a score", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const members = await db
        .select({ scoreId: mentoringScores.id })
        .from(mentorGroupMembers)
        .innerJoin(
          mentorGroupMentors,
          and(
            eq(mentorGroupMentors.groupId, mentorGroupMembers.groupId),
            isNull(mentorGroupMentors.endsOn),
          ),
        )
        .leftJoin(
          mentoringScores,
          eq(mentoringScores.studentId, mentorGroupMembers.studentId),
        );
      const unscored = members.filter((member) => member.scoreId === null);

      expect(unscored.length).toBeGreaterThan(0);
      expect(unscored.length).toBeLessThan(members.length);
    });
  });

  it("each have one log line, with nothing before and the saved score after", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const scores = await db.select().from(mentoringScores);
      const lines = await db.select().from(mentoringScoreChanges);

      expect(lines).toHaveLength(scores.length);
      for (const score of scores) {
        const [line, ...more] = lines.filter(
          (each) => each.scoreId === score.id,
        );

        expect(more).toEqual([]);
        expect(line).toMatchObject({
          changedBy: score.scoredBy,
          scoreBefore: null,
          scoreAfter: score.score,
        });
      }
    });
  });
});
