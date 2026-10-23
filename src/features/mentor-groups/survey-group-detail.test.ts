// Sample Tahun akademik of this file: 7321 to 7322.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestSurveyAnswer,
  addTestSurveyPeriod,
} from "@/mentoring/test-survey-periods";
import { readGroupSurveyDetail } from "./survey-group-detail";
import { addTestEvaluator, addTestPeriods } from "./test-evaluations";
import {
  addTestGroup,
  addTestMembersWithStatus,
  addTestMentor,
  addTestMentorLine,
  addTestProgram,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const EVERY_ROW: RowLimit = { kind: "all" };

function onlyPrograms(studyProgramIds: number[]): RowLimit {
  return { kind: "some", studyProgramIds, menteesOf: [], studentIds: [] };
}

/** A closed survey period and a group of four Aktif members with a mentor. */
async function addRecords(db: Database) {
  const periods = await addTestPeriods(db, 7321);
  const head = await addTestEvaluator(db, ["head_of_unit"]);
  const surveyId = await addTestSurveyPeriod(db, {
    periodId: periods.runningId,
    openedBy: head.id,
    startsOn: "7322-10-01",
    endsOn: "7322-10-20",
    closedBy: head.id,
    closedAt: new Date("7322-10-21T03:00:00Z"),
  });
  const program = await addTestProgram(db, "UJIRINCIHASIL");
  const groupId = await addTestGroup(db, program);
  const mentorId = await addTestMentor(db, { name: "Pengasuh Uji Rinci" });
  await addTestMentorLine(db, groupId, mentorId);
  const members = await addTestMembersWithStatus(
    db,
    { id: groupId, studyProgramId: program },
    9900732101,
    ["active", "active", "active", "active"],
  );
  return { surveyId, program, groupId, mentorId, members };
}

type Records = Awaited<ReturnType<typeof addRecords>>;

async function addAnswers(
  db: Database,
  records: Records,
  answers: { scores: number[]; suggestion: string | null }[],
) {
  for (const [place, answer] of answers.entries()) {
    await addTestSurveyAnswer(db, {
      surveyPeriodId: records.surveyId,
      groupId: records.groupId,
      mentorId: records.mentorId,
      studentId: records.members[place] ?? "",
      ...answer,
    });
  }
}

describe("readGroupSurveyDetail", () => {
  it("gives the average of each statement and the suggestions, without names, once 3 answered", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addAnswers(db, records, [
        {
          scores: [5, 4, 3, 2, 1, 5, 4, 3],
          suggestion: "Zaman ini butuh teladan.",
        },
        { scores: [4, 4, 4, 4, 4, 4, 4, 4], suggestion: null },
        {
          scores: [3, 5, 5, 3, 2, 4, 4, 4],
          suggestion: "Atur jadwal lebih awal.",
        },
      ]);
      const { surveyId, groupId, mentorId } = records;

      const detail = await readGroupSurveyDetail(db, EVERY_ROW, surveyId, {
        groupId,
        mentorId,
      });

      expect(detail).toEqual({
        answers: 3,
        averages: [4, 4.3, 4, 3, 2.3, 4.3, 4, 3.7],
        suggestions: ["Atur jadwal lebih awal.", "Zaman ini butuh teladan."],
      });
    });
  });

  it("sends neither the averages nor the suggestions of a group with fewer than 3 answers", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addAnswers(db, records, [
        { scores: [5, 5, 5, 5, 5, 5, 5, 5], suggestion: "Satu saran saja." },
        { scores: [1, 1, 1, 1, 1, 1, 1, 1], suggestion: "Saran kedua." },
      ]);
      const { surveyId, groupId, mentorId } = records;

      const detail = await readGroupSurveyDetail(db, EVERY_ROW, surveyId, {
        groupId,
        mentorId,
      });

      expect(detail).toEqual({ answers: 2, averages: null, suggestions: null });
      expect(JSON.stringify(detail)).not.toContain("saran");
    });
  });

  it("counts only the answers of the group's Aktif members of today, so 3 answers of whom one went on Cuti stay hidden", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addAnswers(db, records, [
        { scores: [4, 4, 4, 4, 4, 4, 4, 4], suggestion: "Saran pertama." },
        { scores: [4, 4, 4, 4, 4, 4, 4, 4], suggestion: null },
        { scores: [4, 4, 4, 4, 4, 4, 4, 4], suggestion: "Saran ketiga." },
      ]);
      await db
        .update(students)
        .set({ status: "on_leave" })
        .where(eq(students.id, records.members[2] ?? ""));
      const { surveyId, groupId, mentorId } = records;

      const detail = await readGroupSurveyDetail(db, EVERY_ROW, surveyId, {
        groupId,
        mentorId,
      });

      expect(detail).toEqual({ answers: 2, averages: null, suggestions: null });
    });
  });

  it("gives a row of a group without a mentor no answers", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { surveyId, groupId } = records;

      expect(
        await readGroupSurveyDetail(db, EVERY_ROW, surveyId, {
          groupId,
          mentorId: null,
        }),
      ).toEqual({ answers: 0, averages: null, suggestions: null });
    });
  });

  it("gives nothing of a group outside the program of Ketua Program Studi, nor for ids that name nothing", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addAnswers(db, records, [
        { scores: [4, 4, 4, 4, 4, 4, 4, 4], suggestion: "Rahasia." },
        { scores: [4, 4, 4, 4, 4, 4, 4, 4], suggestion: null },
        { scores: [4, 4, 4, 4, 4, 4, 4, 4], suggestion: null },
      ]);
      const { surveyId, groupId, mentorId, program } = records;
      const opened = { groupId, mentorId };

      expect(
        await readGroupSurveyDetail(
          db,
          onlyPrograms([program + 1]),
          surveyId,
          opened,
        ),
      ).toBe(null);
      expect(
        await readGroupSurveyDetail(
          db,
          onlyPrograms([program]),
          surveyId,
          opened,
        ),
      ).toMatchObject({ answers: 3 });
      expect(
        await readGroupSurveyDetail(db, EVERY_ROW, surveyId, {
          groupId: "bukan-id",
          mentorId,
        }),
      ).toBe(null);
      expect(
        await readGroupSurveyDetail(db, EVERY_ROW, "bukan-id", opened),
      ).toBe(null);
    });
  });
});
