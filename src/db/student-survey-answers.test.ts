// Sample Tahun akademik of this file: 4100 to 4100.
// Sample NIMs of this file: 9900910000 to 9900910099.
import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import { daysAfter } from "@/academic-periods/days-after";
import type { Database } from "./connect";
import {
  academicPeriods,
  accounts,
  mentorGroups,
  studentSurveyAnswers,
  studentSurveyPeriods,
  students,
  studyPrograms,
} from "./schema";
import { withTestDatabase } from "./test-database";
import { brokeUniqueRule } from "./unique-violation";

const inTestDatabase = withTestDatabase();

const TODAY = campusDay();
const SCORES = [5, 4, 3, 2, 1, 2, 3, 4];

interface Records {
  surveyPeriodId: string;
  studentId: string;
  groupId: string;
  mentorId: string;
}

async function addAccount(db: Database, name: string): Promise<string> {
  const [account] = await db.insert(accounts).values({ name }).returning();
  if (!account) throw new Error("The account was not added.");
  return account.id;
}

async function addSurveyPeriod(db: Database, openerId: string) {
  const [period] = await db
    .insert(academicPeriods)
    .values({
      startYear: 4100,
      term: "odd",
      startsOn: "4100-08-01",
      endsOn: "4101-01-31",
    })
    .returning();
  if (!period) throw new Error("The period was not added.");
  const [survey] = await db
    .insert(studentSurveyPeriods)
    .values({
      periodId: period.id,
      startsOn: TODAY,
      endsOn: daysAfter(TODAY, 14),
      achievementWeight: 50,
      openedBy: openerId,
      openedAt: new Date(),
    })
    .returning();
  if (!survey) throw new Error("The survey period was not added.");
  return survey.id;
}

async function addRecords(db: Database): Promise<Records> {
  const mentorId = await addAccount(db, "Pengasuh Uji Jawaban Survei");
  const surveyPeriodId = await addSurveyPeriod(db, mentorId);
  const [program] = await db
    .insert(studyPrograms)
    .values({
      name: "Prodi Uji Jawaban Survei",
      code: "Prodi Uji Jawaban Survei",
    })
    .returning();
  if (!program) throw new Error("The program was not added.");
  const [student] = await db
    .insert(students)
    .values({
      nim: "9900910001",
      name: "Mahasiswa Uji Survei",
      studyProgramId: program.id,
      entryPath: "regular",
      sex: "female",
      cohortYear: 2026,
    })
    .returning();
  if (!student) throw new Error("The student was not added.");
  const [group] = await db
    .insert(mentorGroups)
    .values({
      studyProgramId: program.id,
      cohortYear: 2026,
      entryPath: "regular",
      number: 1,
      startsOn: "2026-09-01",
    })
    .returning();
  if (!group) throw new Error("The group was not added.");
  return { surveyPeriodId, studentId: student.id, groupId: group.id, mentorId };
}

type NewAnswer = Partial<typeof studentSurveyAnswers.$inferInsert>;

function addAnswer(db: Database, of: Records, more: NewAnswer = {}) {
  return db
    .insert(studentSurveyAnswers)
    .values({ ...of, scores: SCORES, sentAt: new Date(), ...more })
    .returning();
}

describe("a student survey answer", () => {
  it("is kept with its eight scores, its suggestion, the group and the mentor", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const [kept] = await addAnswer(db, records, { suggestion: "Lanjutkan." });

      expect(kept?.scores).toEqual(SCORES);
      expect(kept?.suggestion).toBe("Lanjutkan.");
      expect(kept?.mentorId).toBe(records.mentorId);
      expect(kept?.groupId).toBe(records.groupId);
    });
  });

  it("is refused a second time for the same student and period, and the refusal names the rule", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addAnswer(db, records);

      const refusal = await addAnswer(db, records).then(
        () => null,
        (error: unknown) => error,
      );

      expect(
        brokeUniqueRule(refusal, "student_survey_answers_one_per_student"),
      ).toBe(true);
    });
  });

  it.each([
    ["seven scores", [5, 4, 3, 2, 1, 2, 3]],
    ["nine scores", [5, 4, 3, 2, 1, 2, 3, 4, 5]],
    ["a score of 0", [0, 4, 3, 2, 1, 2, 3, 4]],
    ["a score of 6", [6, 4, 3, 2, 1, 2, 3, 4]],
  ])("is refused with %s", async (_, scores) => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(addAnswer(db, records, { scores })).rejects.toThrow();
    });
  });

  it("is refused with a score left empty", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const scores = [5, 4, null, 2, 1, 2, 3, 4] as unknown as number[];

      await expect(addAnswer(db, records, { scores })).rejects.toThrow();
    });
  });

  it("is refused with a suggestion longer than 600 characters", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        addAnswer(db, records, { suggestion: "a".repeat(601) }),
      ).rejects.toThrow();
    });
  });

  it("keeps a suggestion of exactly 600 characters", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const [kept] = await addAnswer(db, records, {
        suggestion: "a".repeat(600),
      });

      expect(kept?.suggestion).toHaveLength(600);
    });
  });

  it("is refused with a suggestion of spaces only: no suggestion is empty", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        addAnswer(db, records, { suggestion: "   " }),
      ).rejects.toThrow();
    });
  });
});
