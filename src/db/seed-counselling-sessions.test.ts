// Sample Tahun akademik of this file: those of the app's sample data.
import { asc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import { SAMPLE_SESSIONS } from "./sample-counselling-sessions";
import {
  counsellingSchedules,
  counsellingSessionChanges,
  counsellingSessions,
  students,
} from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

// Loading the whole sample set takes seconds when every check runs at
// once, so everything is checked on one load.
describe("the sample counselling sessions", { timeout: 20_000 }, () => {
  it("are added on a day gone by, written before now, each with the log line of its writing and of its change", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);
      const now = new Date();
      const today = campusDay(now);

      const sessions = await db
        .select({
          id: counsellingSessions.id,
          nim: students.nim,
          scheduleId: counsellingSessions.scheduleId,
          day: counsellingSessions.day,
          notes: counsellingSessions.notes,
          nextDay: counsellingSessions.nextDay,
          writtenAt: counsellingSessions.writtenAt,
          changedAt: counsellingSessions.changedAt,
        })
        .from(counsellingSessions)
        .innerJoin(students, eq(students.id, counsellingSessions.studentId));
      const lines = await db
        .select()
        .from(counsellingSessionChanges)
        .orderBy(asc(counsellingSessionChanges.changedAt));
      const done = await db
        .select({ id: counsellingSchedules.id, day: counsellingSchedules.day })
        .from(counsellingSchedules)
        .where(eq(counsellingSchedules.status, "done"));

      expect(sessions).toHaveLength(SAMPLE_SESSIONS.length);
      for (const sample of SAMPLE_SESSIONS) {
        const session = sessions.find(
          (each) => each.nim === sample.nim && each.notes === sample.notes,
        );
        expect(session).toBeDefined();
        expect((session?.day ?? "") < today).toBe(true);
        expect(session?.changedAt.getTime()).toBeLessThanOrEqual(now.getTime());
        if (session?.nextDay) {
          expect(session.nextDay >= session.day).toBe(true);
        }
        const schedule = done.find((each) => each.id === session?.scheduleId);
        expect(schedule !== undefined).toBe(sample.forDoneSchedule);
        if (schedule) expect(session?.day).toBe(schedule.day);

        const own = lines.filter((line) => line.sessionId === session?.id);
        const steps = sample.firstNotes ? ["write", "change"] : ["write"];
        expect(own.map((line) => line.step)).toEqual(steps);
        expect(own[0]?.before).toBeNull();
        expect(own[0]?.after.notes).toBe(sample.firstNotes ?? sample.notes);
        expect(own.at(-1)?.after.notes).toBe(sample.notes);
        expect(own.at(-1)?.changedAt).toEqual(session?.changedAt);
      }
    });
  });
});
