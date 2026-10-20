// Sample Tahun akademik of this file: those of the app's sample data.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { SAMPLE_SCREENINGS } from "./sample-mental-health-screenings";
import {
  mentalHealthScreeningLog,
  mentalHealthScreenings,
  students,
} from "./schema";
import { fillWithSampleData } from "./seed";
import { counsellorId } from "./seed-counselling-consents";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

// Loading the whole sample set takes seconds when every check runs at
// once, so everything is checked on one load.
describe("the sample mental health screenings", { timeout: 20_000 }, () => {
  it("are kept for their students as the sample Konselor's work, each with the log line of its save, before now", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);
      const now = new Date();
      const konselor = await counsellorId(db);

      const kept = await db
        .select({
          nim: students.nim,
          level: mentalHealthScreenings.level,
          studentId: mentalHealthScreenings.studentId,
          savedBy: mentalHealthScreenings.savedBy,
          savedAt: mentalHealthScreenings.savedAt,
        })
        .from(mentalHealthScreenings)
        .innerJoin(students, eq(students.id, mentalHealthScreenings.studentId));
      const lines = await db.select().from(mentalHealthScreeningLog);

      expect(kept.map(({ nim, level }) => ({ nim, level }))).toEqual(
        expect.arrayContaining(
          SAMPLE_SCREENINGS.map(({ nim, level }) => ({ nim, level })),
        ),
      );
      expect(kept).toHaveLength(SAMPLE_SCREENINGS.length);
      expect(lines).toHaveLength(kept.length);
      for (const screening of kept) {
        expect(screening.savedBy).toBe(konselor);
        expect(screening.savedAt.getTime()).toBeLessThanOrEqual(now.getTime());
        expect(lines).toContainEqual(
          expect.objectContaining({
            studentId: screening.studentId,
            event: "saved",
            by: konselor,
          }),
        );
      }
    });
  });
});
