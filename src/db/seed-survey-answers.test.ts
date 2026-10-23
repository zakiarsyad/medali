// Sample Tahun akademik of this file: those of the app's sample data.
import { and, eq, isNull } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import { SAMPLE_REPLACEMENT } from "./sample-mentor-groups";
import {
  accounts,
  mentorGroupMembers,
  mentorGroupMentors,
  studentSurveyAnswers,
  studentSurveyPeriods,
} from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

// Loading the whole sample set takes seconds when every check runs at
// once, and it waits behind other checks that write the same tables.
describe("the sample survey answers", { timeout: 20_000 }, () => {
  it("answer the sample survey period, each for the group its student is a member of", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const [survey] = await db.select().from(studentSurveyPeriods);
      const stored = await db
        .select({
          surveyPeriodId: studentSurveyAnswers.surveyPeriodId,
          groupId: studentSurveyAnswers.groupId,
          memberOf: mentorGroupMembers.groupId,
          sentOn: studentSurveyAnswers.sentAt,
        })
        .from(studentSurveyAnswers)
        .innerJoin(
          mentorGroupMembers,
          eq(mentorGroupMembers.studentId, studentSurveyAnswers.studentId),
        );

      expect(stored.length).toBeGreaterThan(0);
      for (const answer of stored) {
        expect(answer.surveyPeriodId).toBe(survey?.id);
        expect(answer.groupId).toBe(answer.memberOf);
        const day = campusDay(answer.sentOn);
        expect(day >= (survey?.startsOn ?? "")).toBe(true);
        expect(day <= (survey?.endsOn ?? "")).toBe(true);
      }
    });
  });

  it("name the mentor who held the group when they were sent, also one replaced since", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const named = await db
        .selectDistinct({
          mentor: accounts.name,
          today: mentorGroupMentors.mentorId,
          answerMentor: studentSurveyAnswers.mentorId,
        })
        .from(studentSurveyAnswers)
        .innerJoin(accounts, eq(accounts.id, studentSurveyAnswers.mentorId))
        .innerJoin(
          mentorGroupMentors,
          and(
            eq(mentorGroupMentors.groupId, studentSurveyAnswers.groupId),
            isNull(mentorGroupMentors.endsOn),
          ),
        );
      const names = named.map((one) => one.mentor);

      expect(names).toContain(SAMPLE_REPLACEMENT.oldMentor);
      expect(names).not.toContain(SAMPLE_REPLACEMENT.newMentor);
      const replaced = named.filter((one) => one.today !== one.answerMentor);
      expect(replaced.map((one) => one.mentor)).toEqual([
        SAMPLE_REPLACEMENT.oldMentor,
      ]);
    });
  });
});
