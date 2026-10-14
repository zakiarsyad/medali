// Sample Tahun akademik of this file: those of the app's sample data.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import { SAMPLE_ACCOUNTS, samplePeriods } from "./sample-data";
import { sampleSurveyPeriods } from "./sample-survey-periods";
import { academicPeriods, accounts, studentSurveyPeriods } from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

// Loading the whole sample set takes seconds when every check runs at
// once, and it waits behind other checks that write the same tables.
describe("the sample survey period", { timeout: 20_000 }, () => {
  it("is one, of the period before the running one, opened and closed by hand by the sample Kepala Unit", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const stored = await db
        .select({
          survey: studentSurveyPeriods,
          period: academicPeriods,
          opener: accounts.name,
        })
        .from(studentSurveyPeriods)
        .innerJoin(
          academicPeriods,
          eq(academicPeriods.id, studentSurveyPeriods.periodId),
        )
        .innerJoin(accounts, eq(accounts.id, studentSurveyPeriods.openedBy));
      const [sample] = sampleSurveyPeriods(samplePeriods(campusDay()));

      expect(stored).toHaveLength(1);
      const [found] = stored;
      expect(found?.opener).toBe(SAMPLE_ACCOUNTS[0]?.name);
      expect(found?.period).toMatchObject({
        startYear: sample?.period.startYear,
        term: sample?.period.term,
      });
      expect(found?.survey).toMatchObject({
        startsOn: sample?.startsOn,
        endsOn: sample?.endsOn,
        achievementWeight: 50,
        note: "Data contoh periode lalu.",
        closedBy: found?.survey.openedBy,
        cancelledAt: null,
        cancelledBy: null,
      });
    });
  });

  it("was opened before it was closed, and closed before now", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const [survey] = await db.select().from(studentSurveyPeriods);
      const openedAt = survey?.openedAt.getTime() ?? 0;
      const closedAt = survey?.closedAt?.getTime() ?? 0;

      expect(openedAt).toBeGreaterThan(0);
      expect(openedAt).toBeLessThan(closedAt);
      expect(closedAt).toBeLessThan(Date.now());
    });
  });
});
