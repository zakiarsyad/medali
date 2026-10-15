// Sample Tahun akademik of this file: 3240 to 3240.
// Sample NIMs of this file: 9986000000 to 9986000099.
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "./connect";
import {
  academicPeriods,
  accounts,
  characterAssessments,
  students,
  studyPrograms,
} from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

interface Records {
  accountId: string;
  periodId: string;
  studentId: string;
}

async function addRecords(db: Database): Promise<Records> {
  const [account] = await db
    .insert(accounts)
    .values({ name: "Akun Uji Tabel Asesmen" })
    .returning();
  const [program] = await db
    .insert(studyPrograms)
    .values({ name: "Prodi Uji Tabel Asesmen", code: "UJITABELASESMEN" })
    .returning();
  const [period] = await db
    .insert(academicPeriods)
    .values({
      startYear: 3240,
      term: "odd",
      startsOn: "3240-08-01",
      endsOn: "3241-01-31",
    })
    .returning();
  if (!account || !program || !period) {
    throw new Error("The records were not added.");
  }
  const [student] = await db
    .insert(students)
    .values({
      nim: "9986000001",
      name: "Mahasiswa Uji Tabel Asesmen",
      studyProgramId: program.id,
      entryPath: "regular",
      sex: "female",
      cohortYear: 3240,
    })
    .returning();
  if (!student) throw new Error("The student was not added.");
  return {
    accountId: account.id,
    periodId: period.id,
    studentId: student.id,
  };
}

function addAssessment(
  db: Database,
  of: Records,
  more: Partial<typeof characterAssessments.$inferInsert> = {},
) {
  return db
    .insert(characterAssessments)
    .values({
      id: crypto.randomUUID(),
      studentId: of.studentId,
      scoreM: 80,
      scoreE: 78,
      scoreD: 84,
      scoreA: 72,
      scoreL: 82,
      scoreI: 86,
      source: "mentor_observation",
      note: "",
      periodId: of.periodId,
      enteredBy: of.accountId,
      enteredAt: new Date(),
      ...more,
    })
    .returning();
}

/** In a transaction of its own, so a refusal does not end the check's. */
function inOwnStep<Answer>(db: Database, step: (tx: Database) => Answer) {
  return db.transaction(async (tx) => step(tx));
}

describe("a character assessment", () => {
  it("is refused a score outside 40 to 100 for any value", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      for (const more of [
        { scoreM: 39 },
        { scoreE: 101 },
        { scoreD: 0 },
        { scoreA: 39 },
        { scoreL: 101 },
        { scoreI: 39 },
      ]) {
        await expect(
          inOwnStep(db, (tx) => addAssessment(tx, records, more)),
        ).rejects.toThrow();
      }
      await expect(
        addAssessment(db, records, { scoreM: 40, scoreI: 100 }),
      ).resolves.toHaveLength(1);
    });
  });

  it("is refused a note longer than 500 characters", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        inOwnStep(db, (tx) =>
          addAssessment(tx, records, { note: "a".repeat(501) }),
        ),
      ).rejects.toThrow();
      await expect(
        addAssessment(db, records, { note: "a".repeat(500) }),
      ).resolves.toHaveLength(1);
    });
  });

  it("is never changed, deleted or emptied: the database refuses it", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const [kept] = await addAssessment(db, records);
      if (!kept) throw new Error("The assessment was not added.");

      await expect(
        inOwnStep(db, (tx) =>
          tx
            .update(characterAssessments)
            .set({ scoreM: 90 })
            .where(eq(characterAssessments.id, kept.id)),
        ),
      ).rejects.toThrow();
      await expect(
        inOwnStep(db, (tx) =>
          tx
            .delete(characterAssessments)
            .where(eq(characterAssessments.id, kept.id)),
        ),
      ).rejects.toThrow();
      await expect(
        db.execute(sql`truncate character_assessments`),
      ).rejects.toThrow();
    });
  });
});
