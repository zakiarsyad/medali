// Sample Tahun akademik of this file: 2152 to 2152.
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { academicPeriods, accounts } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { readRunningSurveyPeriod } from "./running-survey-period";
import { runsWith, surveyStatus } from "./survey-status";
import { addTestSurveyPeriod } from "./test-survey-periods";

const inTestDatabase = withTestDatabase();

const TODAY = "2152-10-13";

async function addRecords(db: Database) {
  const [period] = await db
    .insert(academicPeriods)
    .values({
      startYear: 2152,
      term: "odd",
      startsOn: "2152-08-01",
      endsOn: "2153-01-31",
    })
    .returning();
  const [opener] = await db
    .insert(accounts)
    .values({ name: "Akun Uji Periode Survei" })
    .returning();
  if (!period || !opener) throw new Error("The records were not added.");
  return { periodId: period.id, openedBy: opener.id };
}

const CASES = [
  ["waits for its first day", "2152-10-14", "2152-10-28"],
  ["starts today", TODAY, "2152-10-27"],
  ["is on its last day", "2152-10-01", TODAY],
  ["ended yesterday", "2152-09-28", "2152-10-12"],
] as const;

describe("readRunningSurveyPeriod", () => {
  it.each(CASES)(
    "finds a period that %s exactly when its status says it runs",
    async (_words, startsOn, endsOn) => {
      await inTestDatabase(async (db) => {
        const records = await addRecords(db);
        const id = await addTestSurveyPeriod(db, {
          ...records,
          startsOn,
          endsOn,
        });

        const running = await readRunningSurveyPeriod(db, TODAY);

        const status = surveyStatus(
          { startsOn, endsOn, closedAt: null },
          TODAY,
        );
        expect(running?.id ?? null).toBe(runsWith(status) ? id : null);
      });
    },
  );

  it("finds the period with what the card and a student's form need", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addTestSurveyPeriod(db, {
        ...records,
        startsOn: TODAY,
        endsOn: "2152-10-27",
        achievementWeight: 40,
        note: "Isi sebelum akhir bulan.",
      });

      expect(await readRunningSurveyPeriod(db, TODAY)).toMatchObject({
        ...records,
        startsOn: TODAY,
        endsOn: "2152-10-27",
        achievementWeight: 40,
        note: "Isi sebelum akhir bulan.",
      });
    });
  });

  it("finds none once the period is closed by hand, though its last day lies ahead", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addTestSurveyPeriod(db, {
        ...records,
        startsOn: TODAY,
        endsOn: "2152-10-27",
        closedBy: records.openedBy,
        closedAt: new Date(),
      });

      expect(await readRunningSurveyPeriod(db, TODAY)).toBe(null);
    });
  });

  it("finds none once the period is cancelled", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addTestSurveyPeriod(db, {
        ...records,
        startsOn: TODAY,
        endsOn: "2152-10-27",
        cancelledBy: records.openedBy,
        cancelledAt: new Date(),
      });

      expect(await readRunningSurveyPeriod(db, TODAY)).toBe(null);
    });
  });

  it("finds none when no period was ever opened", async () => {
    await inTestDatabase(async (db) => {
      expect(await readRunningSurveyPeriod(db, TODAY)).toBe(null);
    });
  });
});
