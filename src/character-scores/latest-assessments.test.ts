// Sample Tahun akademik of this file: 3600 to 3600.
// Sample NIMs of this file: 9986710000 to 9986710099.
import { inArray } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { academicPeriods, characterAssessments } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import type { PenaltyKind } from "@/discipline-penalties/penalty-kinds";
import {
  addTestPenaltyOf,
  addTestRecorder,
} from "@/discipline-penalties/test-penalties";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import type { Scores } from "./assessment-score";
import {
  earlierAssessments,
  latestAssessments,
  readStoredLatestOf,
} from "./latest-assessments";

const inTestDatabase = withTestDatabase();

const SILVER: Scores = { M: 80, E: 78, D: 84, A: 72, L: 82, I: 86 };
const MIXED: Scores = { M: 90, E: 60, D: 71, A: 70, L: 40, I: 100 };

async function addPeriod(db: Database): Promise<string> {
  const [period] = await db
    .insert(academicPeriods)
    .values({
      startYear: 3600,
      term: "odd",
      startsOn: "3600-08-01",
      endsOn: "3601-01-31",
    })
    .returning();
  if (!period) throw new Error("The period was not added.");
  return period.id;
}

async function addAssessment(
  db: Database,
  studentId: string,
  periodId: string,
  enteredBy: string,
  scores: Scores,
  enteredAt: Date,
): Promise<void> {
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
    enteredBy,
    enteredAt,
  });
}

/** Three students, each assessed MIXED then SILVER, with these penalties. */
const STUDENTS: { nim: string; penalties: PenaltyKind[] }[] = [
  { nim: "9986710001", penalties: [{ category: "medium", level: 3 }] },
  { nim: "9986710002", penalties: [{ category: "heavy", level: 1 }] },
  { nim: "9986710003", penalties: [] },
];

async function addRecords(db: Database): Promise<string[]> {
  const periodId = await addPeriod(db);
  const programId = await addTestProgram(db, "Prodi Uji Skor Terbatas");
  const recorder = await addTestRecorder(db);
  const ids: string[] = [];
  for (const [place, { nim, penalties }] of STUDENTS.entries()) {
    const id = await addTestStudent(db, programId, {
      nim,
      name: `Mahasiswa Uji Skor Terbatas ${place + 1}`,
    });
    ids.push(id);
    for (const kind of penalties) {
      await addTestPenaltyOf(db, id, recorder, kind);
    }
    const before = new Date("3600-09-01T03:00:00Z");
    const after = new Date("3600-10-01T03:00:00Z");
    await addAssessment(db, id, periodId, recorder, MIXED, before);
    await addAssessment(db, id, periodId, recorder, SILVER, after);
  }
  return ids;
}

describe("latestAssessments", () => {
  it("gives a student under a Ringan or Sedang penalty each score at most 70, with the total of those and the total as stored", async () => {
    await inTestDatabase(async (db) => {
      const ids = await addRecords(db);
      const latest = latestAssessments(db);

      const rows = await db
        .select()
        .from(latest)
        .where(inArray(latest.studentId, ids));
      const of = (id: string | undefined) =>
        rows.find((row) => row.studentId === id);

      expect(of(ids[0])).toMatchObject({
        scoreM: 70,
        scoreE: 70,
        scoreD: 70,
        scoreA: 70,
        scoreL: 70,
        scoreI: 70,
        total: 420,
        storedTotal: 482,
        limited: true,
      });
      for (const free of [ids[1], ids[2]]) {
        expect(of(free)).toMatchObject({
          scoreM: 80,
          scoreI: 86,
          total: 482,
          storedTotal: 482,
          limited: false,
        });
      }
    });
  });

  it("as of a day, gives the one saved by the end of that day on campus", async () => {
    await inTestDatabase(async (db) => {
      const ids = await addRecords(db);
      // The later assessment was saved at 10:00 on campus on 3600-10-01.
      const onTheDay = latestAssessments(db, "3600-10-01");
      const dayBefore = latestAssessments(db, "3600-09-30");

      const free = ids.slice(2);
      const [then] = await db
        .select()
        .from(dayBefore)
        .where(inArray(dayBefore.studentId, free));
      const [now] = await db
        .select()
        .from(onTheDay)
        .where(inArray(onTheDay.studentId, free));

      expect(then).toMatchObject({ scoreM: 90, scoreL: 40, total: 431 });
      expect(now).toMatchObject({ scoreM: 80, total: 482 });
    });
  });

  it("as of a day, holds a score at 70 only for a penalty of that day or before", async () => {
    await inTestDatabase(async (db) => {
      const periodId = await addPeriod(db);
      const programId = await addTestProgram(db, "Prodi Uji Skor Pada Hari");
      const recorder = await addTestRecorder(db);
      const id = await addTestStudent(db, programId, {
        nim: "9986710004",
        name: "Mahasiswa Uji Skor Pada Hari",
      });
      const savedAt = new Date("3600-09-01T03:00:00Z");
      await addAssessment(db, id, periodId, recorder, SILVER, savedAt);
      const medium = { category: "medium", level: 1 } as const;
      await addTestPenaltyOf(db, id, recorder, medium, "3600-10-15");

      const asOf = async (day: string) => {
        const latest = latestAssessments(db, day);
        const [row] = await db
          .select()
          .from(latest)
          .where(inArray(latest.studentId, [id]));
        return row;
      };

      expect(await asOf("3600-10-14")).toMatchObject({
        total: 482,
        limited: false,
      });
      expect(await asOf("3600-10-15")).toMatchObject({
        total: 420,
        limited: true,
      });
    });
  });

  it("as of a day before every assessment, gives none", async () => {
    await inTestDatabase(async (db) => {
      const ids = await addRecords(db);
      const latest = latestAssessments(db, "3600-08-31");

      const rows = await db
        .select()
        .from(latest)
        .where(inArray(latest.studentId, ids));

      expect(rows).toEqual([]);
    });
  });
});

describe("earlierAssessments", () => {
  it("holds the assessment before the latest at 70 too, for a limited student only", async () => {
    await inTestDatabase(async (db) => {
      const ids = await addRecords(db);
      const earlier = earlierAssessments(db);

      const rows = await db
        .select()
        .from(earlier)
        .where(inArray(earlier.studentId, ids));
      const of = (id: string | undefined) =>
        rows.find((row) => row.studentId === id);

      expect(of(ids[0])).toMatchObject({
        scoreM: 70,
        scoreE: 60,
        scoreD: 70,
        scoreA: 70,
        scoreL: 40,
        scoreI: 70,
      });
      expect(of(ids[2])).toMatchObject({ scoreM: 90, scoreD: 71, scoreI: 100 });
    });
  });
});

describe("readStoredLatestOf", () => {
  it("gives the scores of the latest assessment as stored, also for a limited student, and null for one never assessed", async () => {
    await inTestDatabase(async (db) => {
      const [limited = ""] = await addRecords(db);
      const programId = await addTestProgram(db, "Prodi Uji Skor Tersimpan");
      const fresh = await addTestStudent(db, programId, {
        nim: "9986710011",
        name: "Mahasiswa Uji Skor Tersimpan",
      });

      expect(await readStoredLatestOf(db, limited)).toEqual(SILVER);
      expect(await readStoredLatestOf(db, fresh)).toBeNull();
    });
  });
});
