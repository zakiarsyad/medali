// Sample Tahun akademik of this file: 2430 to 2430.
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { SCORE_MAX, SCORE_MIN } from "@/mentoring/score-range";
import type { Database } from "./connect";
import {
  academicPeriods,
  accounts,
  mentoringScoreChanges,
  mentoringScores,
  students,
  studyPrograms,
} from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

interface Records {
  studentId: string;
  periodId: string;
  otherPeriodId: string;
  scoredBy: string;
}

async function addRecords(db: Database): Promise<Records> {
  const [account] = await db
    .insert(accounts)
    .values({ name: "Akun Uji Nilai Asuh" })
    .returning();
  const [program] = await db
    .insert(studyPrograms)
    .values({ name: "Prodi Uji Nilai Asuh", code: "UJINILAIASUH" })
    .returning();
  if (!account || !program) throw new Error("The records were not added.");
  const [period, otherPeriod] = await db
    .insert(academicPeriods)
    .values([
      {
        startYear: 2430,
        term: "odd",
        startsOn: "2430-08-01",
        endsOn: "2431-01-31",
      },
      {
        startYear: 2430,
        term: "even",
        startsOn: "2431-02-01",
        endsOn: "2431-07-31",
      },
    ])
    .returning();
  const [student] = await db
    .insert(students)
    .values({
      nim: "UJINILAIASUH001",
      name: "Mahasiswa Uji Nilai Asuh",
      studyProgramId: program.id,
      entryPath: "regular",
      sex: "female",
      cohortYear: 2430,
    })
    .returning();
  if (!period || !otherPeriod || !student) {
    throw new Error("The records were not added.");
  }
  return {
    studentId: student.id,
    periodId: period.id,
    otherPeriodId: otherPeriod.id,
    scoredBy: account.id,
  };
}

function addScore(
  db: Database,
  of: Records,
  score = 80,
  periodId = of.periodId,
) {
  return db
    .insert(mentoringScores)
    .values({
      studentId: of.studentId,
      periodId,
      score,
      scoredBy: of.scoredBy,
      scoredAt: new Date(),
    })
    .returning();
}

async function addLogLine(db: Database): Promise<{ id: string; of: string }> {
  const records = await addRecords(db);
  const [score] = await addScore(db, records);
  if (!score) throw new Error("The score was not added.");
  const [line] = await db
    .insert(mentoringScoreChanges)
    .values({ scoreId: score.id, changedBy: records.scoredBy, scoreAfter: 80 })
    .returning();
  if (!line) throw new Error("The log line was not added.");
  return { id: line.id, of: score.id };
}

describe("a mentoring score", () => {
  it("is refused a second time for one student in one period", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addScore(db, records, 80);

      await expect(addScore(db, records, 90)).rejects.toThrow();
    });
  });

  it("is kept for the same student in another period", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addScore(db, records, 80);

      const [other] = await addScore(db, records, 90, records.otherPeriodId);

      expect(other).toMatchObject({ score: 90 });
    });
  });

  it.each([SCORE_MIN, SCORE_MAX])("takes the score %i", async (score) => {
    await inTestDatabase(async (db) => {
      const [kept] = await addScore(db, await addRecords(db), score);

      expect(kept).toMatchObject({ score });
    });
  });

  it.each([SCORE_MIN - 1, SCORE_MAX + 1])(
    "is refused the score %i, outside the range",
    async (score) => {
      await inTestDatabase(async (db) => {
        const records = await addRecords(db);

        await expect(addScore(db, records, score)).rejects.toThrow();
      });
    },
  );

  it("cannot be deleted once it has a log line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const removal = db
        .delete(mentoringScores)
        .where(eq(mentoringScores.id, line.of));
      await expect(removal).rejects.toThrow();
    });
  });

  it("cannot be emptied, not even together with its log", async () => {
    await inTestDatabase(async (db) => {
      await addLogLine(db);
      await expect(
        db.execute(sql`truncate mentoring_scores cascade`),
      ).rejects.toThrow();
    });
  });
});

describe("the log of mentoring scores", () => {
  it("keeps who changed a score, when, and the score before and after", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const [score] = await addScore(db, records, 70);
      if (!score) throw new Error("The score was not added.");

      const [line] = await db
        .insert(mentoringScoreChanges)
        .values({
          scoreId: score.id,
          changedBy: records.scoredBy,
          scoreBefore: 70,
          scoreAfter: 85,
        })
        .returning();

      expect(line).toMatchObject({
        changedBy: records.scoredBy,
        scoreBefore: 70,
        scoreAfter: 85,
      });
      expect(line?.changedAt).toBeInstanceOf(Date);
    });
  });

  it("refuses to change a line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const change = db
        .update(mentoringScoreChanges)
        .set({ scoreAfter: 100 })
        .where(eq(mentoringScoreChanges.id, line.id));
      await expect(change).rejects.toThrow();
    });
  });

  it("refuses to delete a line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const removal = db
        .delete(mentoringScoreChanges)
        .where(eq(mentoringScoreChanges.id, line.id));
      await expect(removal).rejects.toThrow();
    });
  });

  it("refuses to be emptied", async () => {
    await inTestDatabase(async (db) => {
      await addLogLine(db);
      await expect(
        db.execute(sql`truncate mentoring_score_changes`),
      ).rejects.toThrow();
    });
  });
});
