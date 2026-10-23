// Sample Tahun akademik of this file: 7331 to 7331.
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "./connect";
import {
  academicPeriods,
  accounts,
  mentorGroups,
  mentorSurveyResults,
  studentSurveyPeriods,
  studyPrograms,
  surveyResultFixings,
} from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

type Line = typeof mentorSurveyResults.$inferInsert;

interface Records {
  surveyPeriodId: string;
  accountId: string;
  groupId: string;
}

async function addRecords(db: Database): Promise<Records> {
  const [account] = await db
    .insert(accounts)
    .values({ name: "Kepala Uji Tetapkan Hasil" })
    .returning();
  const [program] = await db
    .insert(studyPrograms)
    .values({ name: "Prodi Uji Tetapkan Hasil", code: "UJITETAPHASIL" })
    .returning();
  const [period] = await db
    .insert(academicPeriods)
    .values({
      startYear: 7331,
      term: "odd",
      startsOn: "7331-08-01",
      endsOn: "7332-01-31",
    })
    .returning();
  if (!account || !program || !period) {
    throw new Error("The records were not added.");
  }
  const [survey] = await db
    .insert(studentSurveyPeriods)
    .values({
      periodId: period.id,
      startsOn: "7331-10-01",
      endsOn: "7331-10-20",
      achievementWeight: 50,
      openedBy: account.id,
      openedAt: new Date(),
      closedBy: account.id,
      closedAt: new Date(),
    })
    .returning();
  const [group] = await db
    .insert(mentorGroups)
    .values({
      studyProgramId: program.id,
      cohortYear: 7331,
      entryPath: "regular",
      number: 1,
      startsOn: "7331-09-01",
    })
    .returning();
  if (!survey || !group) throw new Error("The records were not added.");
  return {
    surveyPeriodId: survey.id,
    accountId: account.id,
    groupId: group.id,
  };
}

async function addFixing(db: Database, records: Records): Promise<string> {
  const [added] = await db
    .insert(surveyResultFixings)
    .values({
      surveyPeriodId: records.surveyPeriodId,
      fixedBy: records.accountId,
      fixedAt: new Date(),
    })
    .returning();
  if (!added) throw new Error("The fixing was not added.");
  return added.id;
}

function line(fixingId: string, records: Records, more: Partial<Line> = {}) {
  return {
    fixingId,
    groupId: records.groupId,
    mentorId: records.accountId,
    respondents: 3,
    members: 4,
    achievement: 74.2,
    feedback: 47.5,
    score: 60.9,
    ...more,
  } satisfies Line;
}

/** In a transaction of its own, so a refusal does not end the check's. */
function inOwnStep<Answer>(db: Database, step: (tx: Database) => Answer) {
  return db.transaction(async (tx) => step(tx));
}

describe("a fixing of survey results", () => {
  it("is kept once per survey period", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addFixing(db, records);

      await expect(
        inOwnStep(db, (tx) => addFixing(tx, records)),
      ).rejects.toThrow();
    });
  });

  it("cannot be changed, deleted or emptied", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const id = await addFixing(db, records);

      await expect(
        inOwnStep(db, (tx) =>
          tx
            .update(surveyResultFixings)
            .set({ fixedAt: new Date() })
            .where(eq(surveyResultFixings.id, id)),
        ),
      ).rejects.toThrow();
      await expect(
        inOwnStep(db, (tx) =>
          tx.delete(surveyResultFixings).where(eq(surveyResultFixings.id, id)),
        ),
      ).rejects.toThrow();
      await expect(
        db.execute(sql`truncate survey_result_fixings cascade`),
      ).rejects.toThrow();
    });
  });
});

describe("a line of fixed survey results", () => {
  it("keeps the numbers of a group with their one decimal", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const fixingId = await addFixing(db, records);
      const value = line(fixingId, records);

      await db.insert(mentorSurveyResults).values(value);
      const [kept] = await db
        .select()
        .from(mentorSurveyResults)
        .where(eq(mentorSurveyResults.fixingId, fixingId));

      expect(kept).toMatchObject(value);
    });
  });

  it("is kept once per group and mentor of a fixing", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const fixingId = await addFixing(db, records);
      await db.insert(mentorSurveyResults).values(line(fixingId, records));

      await expect(
        inOwnStep(db, (tx) =>
          tx.insert(mentorSurveyResults).values(line(fixingId, records)),
        ),
      ).rejects.toThrow();
    });
  });

  it.each<[string, Partial<Line>]>([
    ["fewer than 3 respondents", { respondents: 2 }],
    ["a Capaian karakter above 100", { achievement: 100.1 }],
    ["an Umpan balik below 0", { feedback: -1 }],
    ["a Nilai evaluasi above 100", { score: 101 }],
  ])("is refused with %s", async (_, more) => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const fixingId = await addFixing(db, records);

      await expect(
        inOwnStep(db, (tx) =>
          tx.insert(mentorSurveyResults).values(line(fixingId, records, more)),
        ),
      ).rejects.toThrow();
    });
  });

  it("cannot be changed, deleted or emptied", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const fixingId = await addFixing(db, records);
      await db.insert(mentorSurveyResults).values(line(fixingId, records));
      const ofFixing = eq(mentorSurveyResults.fixingId, fixingId);

      await expect(
        inOwnStep(db, (tx) =>
          tx.update(mentorSurveyResults).set({ score: 90 }).where(ofFixing),
        ),
      ).rejects.toThrow();
      await expect(
        inOwnStep(db, (tx) => tx.delete(mentorSurveyResults).where(ofFixing)),
      ).rejects.toThrow();
      await expect(
        db.execute(sql`truncate mentor_survey_results`),
      ).rejects.toThrow();
    });
  });
});
