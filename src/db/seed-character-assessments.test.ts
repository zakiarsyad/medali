// Sample Tahun akademik of this file: those of the app's sample data.
import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import { runningPeriodOn } from "@/academic-periods/running-period";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import { EARLIER, SAMPLE_ASSESSMENTS } from "./sample-character-assessments";
import { characterAssessments } from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

// Loading the whole sample set takes seconds when every check runs at
// once, so everything is checked on one load.
describe("the sample character assessments", { timeout: 20_000 }, () => {
  it("are all added before now, those made long ago in a period before the running one", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);
      const now = new Date();
      const periods = await readAcademicPeriods(db);
      const running = runningPeriodOn(periods, campusDay(now));

      const rows = await db
        .select()
        .from(characterAssessments)
        .orderBy(characterAssessments.enteredAt);

      expect(rows).toHaveLength(SAMPLE_ASSESSMENTS.length);
      for (const [place, row] of rows.entries()) {
        expect(row.enteredAt.getTime()).toBeLessThanOrEqual(now.getTime());
        const sample = SAMPLE_ASSESSMENTS[place];
        if (sample && sample.daysAgo >= EARLIER) {
          expect(row.periodId).not.toBe(running?.id);
        }
      }
    });
  });
});
