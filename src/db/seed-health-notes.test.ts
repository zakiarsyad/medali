// Sample Tahun akademik of this file: those of the app's sample data.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { SAMPLE_HEALTH_NOTES } from "./sample-health-notes";
import { healthNoteIllnesses, healthNotes, students } from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

// Loading the whole sample set takes seconds when every check runs at
// once, so everything is checked on one load.
describe("the sample health notes", { timeout: 20_000 }, () => {
  it("are all added before now, each for its student with its illnesses", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);
      const now = new Date();

      const notes = await db
        .select({ nim: students.nim, savedAt: healthNotes.savedAt })
        .from(healthNotes)
        .innerJoin(students, eq(students.id, healthNotes.studentId));
      const illnesses = await db.select().from(healthNoteIllnesses);

      expect(notes.map((note) => note.nim).sort()).toEqual(
        SAMPLE_HEALTH_NOTES.map((note) => note.nim).sort(),
      );
      expect(illnesses).toHaveLength(
        SAMPLE_HEALTH_NOTES.flatMap((note) => note.illnesses).length,
      );
      for (const note of notes) {
        expect(note.savedAt.getTime()).toBeLessThanOrEqual(now.getTime());
      }
    });
  });
});
