// Sample Tahun akademik of this file: 2410 to 2410.
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "./connect";
import {
  academicPeriods,
  accounts,
  mentorEvaluationChanges,
  mentorEvaluations,
  mentorGroups,
  studyPrograms,
} from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

const SCORES = { activity: 80, attendance: 75, achievement: 70, feedback: 85 };

interface Records {
  groupId: string;
  mentorId: string;
  periodId: string;
}

async function addRecords(db: Database): Promise<Records> {
  const [account] = await db
    .insert(accounts)
    .values({ name: "Akun Uji Evaluasi" })
    .returning();
  const [program] = await db
    .insert(studyPrograms)
    .values({ name: "Prodi Uji Evaluasi", code: "UJIEVAL" })
    .returning();
  if (!account || !program) throw new Error("The records were not added.");
  const [group] = await db
    .insert(mentorGroups)
    .values({
      studyProgramId: program.id,
      cohortYear: 2410,
      entryPath: "regular",
      number: 1,
      startsOn: "2410-09-01",
    })
    .returning();
  const [period] = await db
    .insert(academicPeriods)
    .values({
      startYear: 2410,
      term: "odd",
      startsOn: "2410-08-01",
      endsOn: "2411-01-31",
    })
    .returning();
  if (!group || !period) throw new Error("The records were not added.");
  return { groupId: group.id, mentorId: account.id, periodId: period.id };
}

type NewEvaluation = Partial<typeof mentorEvaluations.$inferInsert>;

function addEvaluation(db: Database, of: Records, more: NewEvaluation = {}) {
  return db
    .insert(mentorEvaluations)
    .values({
      ...of,
      ...SCORES,
      evaluatedBy: of.mentorId,
      evaluatedAt: new Date(),
      ...more,
    })
    .returning();
}

async function addLogLine(db: Database): Promise<{ id: string; of: string }> {
  const records = await addRecords(db);
  const [evaluation] = await addEvaluation(db, records);
  if (!evaluation) throw new Error("The evaluation was not added.");
  const [line] = await db
    .insert(mentorEvaluationChanges)
    .values({
      evaluationId: evaluation.id,
      changedBy: records.mentorId,
      activityAfter: SCORES.activity,
      attendanceAfter: SCORES.attendance,
      achievementAfter: SCORES.achievement,
      feedbackAfter: SCORES.feedback,
    })
    .returning();
  if (!line) throw new Error("The log line was not added.");
  return { id: line.id, of: evaluation.id };
}

describe("a mentor evaluation", () => {
  it("is refused a second time for one group and period", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addEvaluation(db, records);

      await expect(addEvaluation(db, records)).rejects.toThrow();
    });
  });

  it.each([
    { activity: -1 },
    { attendance: 101 },
    { achievement: 101 },
    { feedback: -1 },
  ])("is refused the value %o, outside 0 to 100", async (wrong) => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(addEvaluation(db, records, wrong)).rejects.toThrow();
    });
  });

  it("takes 0 and 100", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const [evaluation] = await addEvaluation(db, records, {
        activity: 0,
        feedback: 100,
      });

      expect(evaluation).toMatchObject({ activity: 0, feedback: 100 });
    });
  });

  it("cannot be deleted once it has a log line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const removal = db
        .delete(mentorEvaluations)
        .where(eq(mentorEvaluations.id, line.of));
      await expect(removal).rejects.toThrow();
    });
  });

  it("cannot be emptied, not even together with its log", async () => {
    await inTestDatabase(async (db) => {
      await addLogLine(db);
      await expect(
        db.execute(sql`truncate mentor_evaluations cascade`),
      ).rejects.toThrow();
    });
  });
});

describe("the log of mentor evaluations", () => {
  it("refuses to change a line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const change = db
        .update(mentorEvaluationChanges)
        .set({ activityAfter: 1 })
        .where(eq(mentorEvaluationChanges.id, line.id));
      await expect(change).rejects.toThrow();
    });
  });

  it("refuses to delete a line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const removal = db
        .delete(mentorEvaluationChanges)
        .where(eq(mentorEvaluationChanges.id, line.id));
      await expect(removal).rejects.toThrow();
    });
  });

  it("refuses to be emptied", async () => {
    await inTestDatabase(async (db) => {
      await addLogLine(db);
      await expect(
        db.execute(sql`truncate mentor_evaluation_changes`),
      ).rejects.toThrow();
    });
  });
});
