// Sample Tahun akademik of this file: 3290 to 3290.
// Sample NIMs of this file: 9986100000 to 9986100099.
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "./connect";
import {
  academicPeriods,
  accounts,
  dormWarningLetterChanges,
  dormWarningLetters,
  students,
  studyPrograms,
} from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

// 16:30 on campus on 14 October 3290.
const ISSUED = new Date("3290-10-14T09:30:00Z");

interface Records {
  accountId: string;
  studentId: string;
  periodId: string;
}

async function addRecords(db: Database): Promise<Records> {
  const [account] = await db
    .insert(accounts)
    .values({ name: "Akun Uji Tabel SP" })
    .returning();
  const [program] = await db
    .insert(studyPrograms)
    .values({ name: "Prodi Uji Tabel SP", code: "UJITABELSP" })
    .returning();
  const [period] = await db
    .insert(academicPeriods)
    .values({
      startYear: 3290,
      term: "odd",
      startsOn: "3290-08-01",
      endsOn: "3291-01-31",
    })
    .returning();
  if (!account || !program || !period) {
    throw new Error("The records were not added.");
  }
  const [student] = await db
    .insert(students)
    .values({
      nim: "9986100001",
      name: "Mahasiswa Uji Tabel SP",
      studyProgramId: program.id,
      entryPath: "regular",
      sex: "female",
      cohortYear: 3290,
    })
    .returning();
  if (!student) throw new Error("The student was not added.");
  return {
    accountId: account.id,
    studentId: student.id,
    periodId: period.id,
  };
}

const CALL = {
  callDay: "3290-10-15",
  callTime: "16:00",
  callPlace: "Kantor Pengelola Asrama",
};

function addLetter(
  db: Database,
  of: Records,
  more: Partial<typeof dormWarningLetters.$inferInsert> = {},
) {
  return db
    .insert(dormWarningLetters)
    .values({
      studentId: of.studentId,
      periodId: of.periodId,
      level: 1,
      ...CALL,
      ...more,
    })
    .returning();
}

function issued(of: Records, level: 1 | 2 = 1) {
  return {
    level,
    result: "Mahasiswa mengakui pelanggaran dan berjanji memperbaiki.",
    issuedBy: of.accountId,
    issuedAt: ISSUED,
  };
}

/** In a transaction of its own, so a refusal does not end the check's. */
function inOwnStep<Answer>(db: Database, step: (tx: Database) => Answer) {
  return db.transaction(async (tx) => step(tx));
}

async function addLogLine(db: Database): Promise<{ id: string; of: string }> {
  const records = await addRecords(db);
  const [letter] = await addLetter(db, records);
  if (!letter) throw new Error("The letter was not added.");
  const [line] = await db
    .insert(dormWarningLetterChanges)
    .values({
      letterId: letter.id,
      changedBy: records.accountId,
      action: "scheduled",
      ...CALL,
    })
    .returning();
  if (!line) throw new Error("The log line was not added.");
  return { id: line.id, of: letter.id };
}

describe("a call and its warning letter", () => {
  it("is kept once per resident, semester and level", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await addLetter(db, records, issued(records));
      await expect(
        inOwnStep(db, (tx) => addLetter(tx, records, issued(records))),
      ).rejects.toThrow();
      await expect(
        addLetter(db, records, issued(records, 2)),
      ).resolves.toHaveLength(1);
    });
  });

  it("is SP 1 or SP 2 only", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      for (const level of [0, 3]) {
        await expect(
          inOwnStep(db, (tx) => addLetter(tx, records, { level })),
        ).rejects.toThrow();
      }
    });
  });

  it("has a whole schedule or none, with a place of 3 to 100 letters", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      for (const part of [
        { callDay: null },
        { callTime: null },
        { callPlace: null },
        { callPlace: "ab" },
        { callPlace: "a".repeat(101) },
      ]) {
        await expect(
          inOwnStep(db, (tx) => addLetter(tx, records, part)),
        ).rejects.toThrow();
      }
      await expect(
        addLetter(db, records, {
          callDay: null,
          callTime: null,
          callPlace: null,
        }),
      ).resolves.toHaveLength(1);
    });
  });

  it("is issued with who, when and a result of 10 to 1,000 letters together", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const whole = issued(records);

      for (const part of [
        { ...whole, issuedBy: null },
        { ...whole, issuedAt: null },
        { ...whole, result: "" },
        { ...whole, result: "Hadir." },
        { ...whole, result: "a".repeat(1001) },
        { result: whole.result },
      ]) {
        await expect(
          inOwnStep(db, (tx) => addLetter(tx, records, part)),
        ).rejects.toThrow();
      }
      await expect(addLetter(db, records, whole)).resolves.toHaveLength(1);
    });
  });

  it("holds the note of a proposal only on an issued SP 2", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const proposalNote = "Pelanggaran berulang setelah SP 1.";

      await expect(
        inOwnStep(db, (tx) =>
          addLetter(tx, records, { ...issued(records, 1), proposalNote }),
        ),
      ).rejects.toThrow();
      await expect(
        inOwnStep(db, (tx) =>
          addLetter(tx, records, { level: 2, proposalNote }),
        ),
      ).rejects.toThrow();
      await expect(
        inOwnStep(db, (tx) =>
          addLetter(tx, records, {
            ...issued(records, 2),
            proposalNote: "a".repeat(1001),
          }),
        ),
      ).rejects.toThrow();
      await expect(
        addLetter(db, records, { ...issued(records, 2), proposalNote }),
      ).resolves.toHaveLength(1);
    });
  });

  it("cannot be changed once issued", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const [letter] = await addLetter(db, records, issued(records));
      if (!letter) throw new Error("The letter was not added.");

      const change = db
        .update(dormWarningLetters)
        .set({ callPlace: "Aula asrama" })
        .where(eq(dormWarningLetters.id, letter.id));
      await expect(change).rejects.toThrow();
    });
  });

  it("can have its schedule changed until it is issued", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const [letter] = await addLetter(db, records);
      if (!letter) throw new Error("The letter was not added.");

      await db
        .update(dormWarningLetters)
        .set({ callPlace: "Aula asrama" })
        .where(eq(dormWarningLetters.id, letter.id));
      await db
        .update(dormWarningLetters)
        .set(issued(records))
        .where(eq(dormWarningLetters.id, letter.id));

      const [kept] = await db
        .select()
        .from(dormWarningLetters)
        .where(eq(dormWarningLetters.id, letter.id));
      expect(kept).toMatchObject({
        callPlace: "Aula asrama",
        issuedAt: ISSUED,
      });
    });
  });

  it("cannot be deleted once it has a log line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const removal = db
        .delete(dormWarningLetters)
        .where(eq(dormWarningLetters.id, line.of));
      await expect(removal).rejects.toThrow();
    });
  });
});

describe("the log of calls and warning letters", () => {
  it("refuses to change a line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const change = db
        .update(dormWarningLetterChanges)
        .set({ action: "issued" })
        .where(eq(dormWarningLetterChanges.id, line.id));
      await expect(change).rejects.toThrow();
    });
  });

  it("refuses to delete a line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const removal = db
        .delete(dormWarningLetterChanges)
        .where(eq(dormWarningLetterChanges.id, line.id));
      await expect(removal).rejects.toThrow();
    });
  });

  it("refuses to be emptied", async () => {
    await inTestDatabase(async (db) => {
      await addLogLine(db);
      await expect(
        db.execute(sql`truncate dorm_warning_letter_changes`),
      ).rejects.toThrow();
    });
  });
});
