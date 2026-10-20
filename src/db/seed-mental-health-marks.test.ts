// Sample Tahun akademik of this file: those of the app's sample data.
import { and, eq, inArray, isNull } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import { menteesOf } from "@/mentoring/mentees-of";
import { samplePeriods } from "./sample-data";
import { SAMPLE_MENTAL_HEALTH_MARKS } from "./sample-mental-health-marks";
import {
  accounts,
  healthNotes,
  mentalHealthMarkChanges,
  mentalHealthMarks,
  students,
} from "./schema";
import { fillWithSampleData } from "./seed";
import { noteResidents } from "./seed-health-notes";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

// Loading the whole sample set takes seconds when every check runs at
// once, so everything is checked on one load.
describe("the sample mental health marks", { timeout: 20_000 }, () => {
  it("are kept for their residents, each with its log line, a mentee and a resident with no note among them", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);
      const now = new Date();
      const [running] = samplePeriods(campusDay(now));
      if (!running) throw new Error("There is no sample period.");
      const residents = await noteResidents(db, running);
      const markedIds = SAMPLE_MENTAL_HEALTH_MARKS.map(
        (mark) => residents[mark.resident] ?? "",
      );

      const marks = await db.select().from(mentalHealthMarks);
      const lines = await db.select().from(mentalHealthMarkChanges);

      expect(marks.map((mark) => mark.studentId).sort()).toEqual(
        [...markedIds].sort(),
      );
      expect(lines).toHaveLength(marks.length);
      for (const mark of marks) {
        expect(mark.changedAt.getTime()).toBeLessThanOrEqual(now.getTime());
        expect(lines).toContainEqual(
          expect.objectContaining({
            studentId: mark.studentId,
            categoryBefore: null,
            categoryAfter: mark.category,
            observationAfter: mark.observation,
            changedBy: mark.changedBy,
          }),
        );
      }

      const [pengasuh] = await db
        .select({ id: accounts.id })
        .from(accounts)
        .where(
          and(eq(accounts.name, "Hendra Wijaya"), isNull(accounts.studentId)),
        );
      const markedMentees = await db
        .select({ id: students.id })
        .from(students)
        .where(
          and(inArray(students.id, markedIds), menteesOf([pengasuh?.id ?? ""])),
        );
      expect(markedMentees).toHaveLength(1);

      const noted = await db
        .selectDistinct({ id: healthNotes.studentId })
        .from(healthNotes)
        .where(inArray(healthNotes.studentId, markedIds));
      expect(noted).toHaveLength(markedIds.length - 1);
    });
  });
});
