// Sample Tahun akademik of this file: 4474 to 4474.
// Sample NIMs of this file: 9987704000 to 9987704099.
import { asc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  accounts,
  characterAssessments,
  coachingStatusChanges,
  coachingStatuses,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import type { Scores } from "./assessment-score";
import { restartReturningCoaching } from "./coaching-restart";
import type { CoachingStatus } from "./coaching-status";

const inTestDatabase = withTestDatabase();

const LISTED: Scores = { M: 55, E: 58, D: 60, A: 57, L: 59, I: 61 };
const NOT_LISTED: Scores = { M: 66, E: 70, D: 58, A: 72, L: 68, I: 71 };

interface Setting {
  periodId: string;
  kepala: string;
  penilai: string;
  studentIds: string[];
}

async function setting(db: Database, count: number): Promise<Setting> {
  const [period] = await db
    .insert(academicPeriods)
    .values({
      startYear: 4474,
      term: "odd",
      startsOn: "4474-08-01",
      endsOn: "4475-01-31",
    })
    .returning();
  const [kepala] = await db
    .insert(accounts)
    .values({ name: "Kepala Uji Mulai Lagi" })
    .returning();
  const [penilai] = await db
    .insert(accounts)
    .values({ name: "Penilai Uji Mulai Lagi" })
    .returning();
  if (!period || !kepala || !penilai) throw new Error("Records missing.");
  const programId = await addTestProgram(db, "Prodi Uji Mulai Lagi");
  const studentIds: string[] = [];
  for (let place = 1; place <= count; place += 1) {
    studentIds.push(
      await addTestStudent(db, programId, {
        nim: `99877040${String(place).padStart(2, "0")}`,
        name: `Mahasiswa Uji Mulai Lagi ${place}`,
      }),
    );
  }
  return {
    periodId: period.id,
    kepala: kepala.id,
    penilai: penilai.id,
    studentIds,
  };
}

let minute = 0;

async function assess(
  db: Database,
  { periodId, penilai }: Setting,
  studentId: string,
  scores: Scores,
): Promise<void> {
  minute += 1;
  await db.insert(characterAssessments).values({
    id: crypto.randomUUID(),
    studentId,
    scoreM: scores.M,
    scoreE: scores.E,
    scoreD: scores.D,
    scoreA: scores.A,
    scoreL: scores.L,
    scoreI: scores.I,
    source: "mentor_observation",
    note: "",
    periodId,
    enteredBy: penilai,
    enteredAt: new Date(Date.UTC(4474, 8, 1, 3, minute)),
  });
}

async function setStatus(
  db: Database,
  studentId: string,
  by: string,
  status: CoachingStatus,
  note: string,
): Promise<void> {
  await db.insert(coachingStatuses).values({
    studentId,
    status,
    note,
    version: 3,
    changedBy: by,
    changedAt: new Date(),
  });
}

async function statusOf(db: Database, studentId: string) {
  const [kept] = await db
    .select()
    .from(coachingStatuses)
    .where(eq(coachingStatuses.studentId, studentId));
  return kept;
}

function linesOf(db: Database, studentId: string) {
  return db
    .select()
    .from(coachingStatusChanges)
    .where(eq(coachingStatusChanges.studentId, studentId))
    .orderBy(asc(coachingStatusChanges.changedAt));
}

describe("restartReturningCoaching", () => {
  it("puts a student who left the list and is listed again back at Teridentifikasi with no note, logged as the work of who saved the assessment", async () => {
    await inTestDatabase(async (db) => {
      const records = await setting(db, 1);
      const [ani = ""] = records.studentIds;
      await assess(db, records, ani, LISTED);
      await setStatus(db, ani, records.kepala, "done", "Sudah membaik.");
      await assess(db, records, ani, NOT_LISTED);
      await restartReturningCoaching(db, [ani], records.penilai);
      expect((await statusOf(db, ani))?.status).toBe("done");

      await assess(db, records, ani, LISTED);
      await restartReturningCoaching(db, [ani], records.penilai);

      expect(await statusOf(db, ani)).toEqual(
        expect.objectContaining({
          status: "identified",
          note: "",
          version: 4,
          changedBy: records.penilai,
        }),
      );
      expect(await linesOf(db, ani)).toEqual([
        expect.objectContaining({
          statusBefore: "done",
          noteBefore: "Sudah membaik.",
          statusAfter: "identified",
          noteAfter: "",
          changedBy: records.penilai,
        }),
      ]);
    });
  });

  it("keeps the status of a student whose new assessment lists them again, and adds nothing for a student with none", async () => {
    await inTestDatabase(async (db) => {
      const records = await setting(db, 2);
      const [ani = "", budi = ""] = records.studentIds;
      await assess(db, records, ani, LISTED);
      await setStatus(db, ani, records.kepala, "counselling", "");
      await assess(db, records, budi, NOT_LISTED);

      await assess(db, records, ani, LISTED);
      await assess(db, records, budi, LISTED);
      await restartReturningCoaching(db, [ani, budi], records.penilai);

      expect((await statusOf(db, ani))?.status).toBe("counselling");
      expect((await statusOf(db, ani))?.version).toBe(3);
      expect(await statusOf(db, budi)).toBeUndefined();
      expect(await linesOf(db, ani)).toEqual([]);
      expect(await linesOf(db, budi)).toEqual([]);
    });
  });
});
