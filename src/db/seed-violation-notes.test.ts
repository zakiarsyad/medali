// Sample Tahun akademik of this file: those of the app's sample data.
import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import { runningPeriodOn } from "@/academic-periods/running-period";
import { samplePeriods } from "./sample-data";
import { SAMPLE_VIOLATION_NOTES } from "./sample-violation-notes";
import { students, violationNoteChanges, violationNotes } from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

// Loading the whole sample set takes seconds when every check runs at
// once, so everything is checked on one load.
describe("the sample violation notes", { timeout: 20_000 }, () => {
  it("are kept in the semester each names, by today at the latest, each with its log line", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);
      const today = campusDay();
      const periods = samplePeriods(today);
      const notes = await db.select().from(violationNotes);
      const lines = await db.select().from(violationNoteChanges);
      const nims = new Map(
        (await db.select().from(students)).map((s) => [s.id, s.nim]),
      );

      expect(notes).toHaveLength(SAMPLE_VIOLATION_NOTES.length);
      expect(lines).toHaveLength(notes.length);
      for (const sample of SAMPLE_VIOLATION_NOTES) {
        const kept = notes.find(
          (note) =>
            nims.get(note.studentId) === sample.nim &&
            note.description === sample.description,
        );
        expect(kept?.day).toBeDefined();
        const day = kept?.day ?? "";
        expect(day <= today).toBe(true);
        expect(runningPeriodOn(periods, day)).toBe(periods[sample.semester]);
        expect(kept?.removedAt).toBeNull();
        expect(lines).toContainEqual(
          expect.objectContaining({
            noteId: kept?.id,
            action: "added",
            changedBy: kept?.savedBy,
          }),
        );
      }
    });
  });
});
