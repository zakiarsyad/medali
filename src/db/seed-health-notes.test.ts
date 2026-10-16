// Sample Tahun akademik of this file: those of the app's sample data.
import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import { readDormCohorts } from "@/dorms/dorm-cohorts";
import { dormInSql } from "@/dorms/resident-condition";
import { menteesOf } from "@/mentoring/mentees-of";
import { SAMPLE_ACCOUNTS, samplePeriods } from "./sample-data";
import {
  SAMPLE_DORM_HEALTH_NOTES,
  SAMPLE_HEALTH_NOTES,
} from "./sample-health-notes";
import {
  accounts,
  healthNoteIllnesses,
  healthNotes,
  students,
  studyPrograms,
} from "./schema";
import { fillWithSampleData } from "./seed";
import { noteResidents } from "./seed-health-notes";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

const NOTES = [...SAMPLE_HEALTH_NOTES, ...SAMPLE_DORM_HEALTH_NOTES];

/** The program of the sample Ketua Program Studi. */
const KAPRODI_PROGRAM = SAMPLE_ACCOUNTS.find((account) =>
  account.roles.includes("head_of_program"),
)?.studyProgram;

// Loading the whole sample set takes seconds when every check runs at
// once, so everything is checked on one load.
describe("the sample health notes", { timeout: 20_000 }, () => {
  it("are all added before now, each for its student with its illnesses, dorm residents' among them", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);
      const now = new Date();
      const today = campusDay(now);
      const [running] = samplePeriods(today);
      if (!running) throw new Error("There is no sample period.");
      const cohorts = (await readDormCohorts(db, today)) ?? [];
      const dorm = dormInSql(cohorts);

      const notes = await db
        .select({
          nim: students.nim,
          savedAt: healthNotes.savedAt,
          dorm,
        })
        .from(healthNotes)
        .innerJoin(students, eq(students.id, healthNotes.studentId));
      const illnesses = await db.select().from(healthNoteIllnesses);

      expect(notes).toHaveLength(NOTES.length);
      const outside = notes.filter((note) => note.dorm === null);
      expect(outside.map((note) => note.nim).sort()).toEqual(
        SAMPLE_HEALTH_NOTES.map((note) => note.nim).sort(),
      );
      expect(notes.length - outside.length).toBe(
        SAMPLE_DORM_HEALTH_NOTES.length,
      );
      expect(illnesses).toHaveLength(
        NOTES.flatMap((note) => note.illnesses).length,
      );
      for (const note of notes) {
        expect(note.savedAt.getTime()).toBeLessThanOrEqual(now.getTime());
      }

      const [first, second] = await noteResidents(db, running);
      const [pengasuh] = await db
        .select({ id: accounts.id })
        .from(accounts)
        .where(eq(accounts.name, "Hendra Wijaya"));
      const mentees = await db
        .select({ id: students.id })
        .from(students)
        .where(
          and(
            menteesOf([pengasuh?.id ?? ""]),
            inArray(students.id, [first ?? "", second ?? ""]),
          ),
        );
      expect(mentees).toHaveLength(2);

      const [inProgram] = await db
        .select({ residents: sql<number>`count(*)::int` })
        .from(students)
        .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
        .where(
          and(eq(studyPrograms.name, KAPRODI_PROGRAM ?? ""), isNotNull(dorm)),
        );
      expect(inProgram?.residents).toBeGreaterThanOrEqual(5);
    });
  });
});
