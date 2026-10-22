// Sample Tahun akademik of this file: 5100 to 5100.
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "./connect";
import {
  academicPeriods,
  accounts,
  fixedCharacterGrades,
  semesterClosings,
  students,
  studyPrograms,
} from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

type Closing = typeof semesterClosings.$inferInsert;
type FixedGrade = typeof fixedCharacterGrades.$inferInsert;

interface Records {
  periodId: string;
  closedBy: string;
  studentId: string;
}

async function addRecords(db: Database): Promise<Records> {
  const [account] = await db
    .insert(accounts)
    .values({ name: "Kepala Uji Tutup Semester" })
    .returning();
  const [program] = await db
    .insert(studyPrograms)
    .values({ name: "Prodi Uji Tutup Semester", code: "UJITUTUPSMT" })
    .returning();
  const [period] = await db
    .insert(academicPeriods)
    .values({
      startYear: 5100,
      term: "odd",
      startsOn: "5100-08-01",
      endsOn: "5101-01-31",
    })
    .returning();
  if (!account || !program || !period) {
    throw new Error("The records were not added.");
  }
  const [student] = await db
    .insert(students)
    .values({
      nim: "UJITUTUPSMT001",
      name: "Mahasiswa Uji Tutup Semester",
      studyProgramId: program.id,
      entryPath: "regular",
      sex: "female",
      cohortYear: 5100,
    })
    .returning();
  if (!student) throw new Error("The student was not added.");
  return { periodId: period.id, closedBy: account.id, studentId: student.id };
}

function closing(records: Records, more: Partial<Closing> = {}): Closing {
  return {
    periodId: records.periodId,
    closedBy: records.closedBy,
    closedAt: new Date(),
    attendanceWeight: 25,
    mentoringWeight: 25,
    sikuWeight: 25,
    skpmWeight: 25,
    aFrom: 85,
    bFrom: 70,
    cFrom: 60,
    dFrom: 50,
    passLetter: "B",
    students: 1,
    complete: 1,
    incomplete: 0,
    ...more,
  };
}

async function addClosing(db: Database, value: Closing): Promise<string> {
  const [added] = await db.insert(semesterClosings).values(value).returning();
  if (!added) throw new Error("The closing was not added.");
  return added.id;
}

/** 90, 80, 66 and 72 with 25% each: 77.0, B, passes. */
function grade(
  closingId: string,
  records: Records,
  more: Partial<FixedGrade> = {},
): FixedGrade {
  return {
    closingId,
    studentId: records.studentId,
    attendance: 90,
    attended: 9,
    counted: 10,
    mentoring: 80,
    siku: 66,
    sikuAdjusted: true,
    sikuNote: "SIKU 65 +1",
    skpm: 72,
    final: 77,
    letter: "B",
    passes: true,
    limited: false,
    limitedFrom: null,
    ...more,
  };
}

const INCOMPLETE: Partial<FixedGrade> = {
  mentoring: null,
  final: null,
  letter: null,
  passes: null,
};

/** In a transaction of its own, so a refusal does not end the check's. */
function inOwnStep<Answer>(db: Database, step: (tx: Database) => Answer) {
  return db.transaction(async (tx) => step(tx));
}

describe("a semester closing", () => {
  it("is kept once per period", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addClosing(db, closing(records));

      await expect(
        inOwnStep(db, (tx) => addClosing(tx, closing(records))),
      ).rejects.toThrow();
    });
  });

  it("is refused with counts that do not add up", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        inOwnStep(db, (tx) =>
          addClosing(tx, closing(records, { students: 2, complete: 1 })),
        ),
      ).rejects.toThrow();
    });
  });

  it("cannot be changed, deleted or emptied", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const id = await addClosing(db, closing(records));

      await expect(
        inOwnStep(db, (tx) =>
          tx
            .update(semesterClosings)
            .set({ passLetter: "A" })
            .where(eq(semesterClosings.id, id)),
        ),
      ).rejects.toThrow();
      await expect(
        inOwnStep(db, (tx) =>
          tx.delete(semesterClosings).where(eq(semesterClosings.id, id)),
        ),
      ).rejects.toThrow();
      await expect(
        db.execute(sql`truncate semester_closings cascade`),
      ).rejects.toThrow();
    });
  });
});

describe("a fixed character grade", () => {
  it.each<[string, Partial<FixedGrade>]>([
    ["a complete grade", {}],
    ["a grade Belum lengkap with the parts it has", INCOMPLETE],
    [
      "a grade the limit lowered, with the score before it",
      { final: 70, letter: "B", limited: true, limitedFrom: 77 },
    ],
  ])("keeps %s", async (_, more) => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const closingId = await addClosing(db, closing(records));
      const value = grade(closingId, records, more);

      await db.insert(fixedCharacterGrades).values(value);
      const [kept] = await db
        .select()
        .from(fixedCharacterGrades)
        .where(eq(fixedCharacterGrades.closingId, closingId));

      expect(kept).toEqual(value);
    });
  });

  it.each<[string, Partial<FixedGrade>]>([
    ["no Nilai akhir with every part", { final: null }],
    ["a Nilai akhir with a part missing", { mentoring: null }],
    ["a Nilai akhir without its letter", { letter: null }],
    ["a letter without Nilai akhir", { ...INCOMPLETE, letter: "B" }],
    ["a score before the limit of a grade not limited", { limitedFrom: 80 }],
    [
      "a score before the limit below Nilai akhir",
      { limited: true, limitedFrom: 70 },
    ],
  ])("is refused with %s", async (_, more) => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const closingId = await addClosing(db, closing(records));

      await expect(
        inOwnStep(db, (tx) =>
          tx
            .insert(fixedCharacterGrades)
            .values(grade(closingId, records, more)),
        ),
      ).rejects.toThrow();
    });
  });

  it("is kept once per student and closing", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const closingId = await addClosing(db, closing(records));
      await db.insert(fixedCharacterGrades).values(grade(closingId, records));

      await expect(
        inOwnStep(db, (tx) =>
          tx.insert(fixedCharacterGrades).values(grade(closingId, records)),
        ),
      ).rejects.toThrow();
    });
  });

  it("cannot be changed, deleted or emptied", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const closingId = await addClosing(db, closing(records));
      await db.insert(fixedCharacterGrades).values(grade(closingId, records));
      const ofClosing = eq(fixedCharacterGrades.closingId, closingId);

      await expect(
        inOwnStep(db, (tx) =>
          tx
            .update(fixedCharacterGrades)
            .set({ final: 90, letter: "A" })
            .where(ofClosing),
        ),
      ).rejects.toThrow();
      await expect(
        inOwnStep(db, (tx) => tx.delete(fixedCharacterGrades).where(ofClosing)),
      ).rejects.toThrow();
      await expect(
        db.execute(sql`truncate fixed_character_grades`),
      ).rejects.toThrow();
    });
  });
});
