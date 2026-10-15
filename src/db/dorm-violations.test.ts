// Sample Tahun akademik of this file: 3150 to 3150.
// Sample NIMs of this file: 9982010000 to 9982010099.
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "./connect";
import {
  academicPeriods,
  accounts,
  dormViolationChanges,
  dormViolations,
  students,
  studyPrograms,
} from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

// 21:00 on campus on 12 October 3150, the day of the violations below.
const ANNOUNCED = new Date("3150-10-12T14:00:00Z");
const ENTERED = new Date("3150-10-12T12:00:00Z");

interface Records {
  accountId: string;
  studentId: string;
}

async function addRecords(db: Database): Promise<Records> {
  const [account] = await db
    .insert(accounts)
    .values({ name: "Akun Uji Tabel Pelanggaran" })
    .returning();
  const [program] = await db
    .insert(studyPrograms)
    .values({ name: "Prodi Uji Tabel Pelanggaran", code: "UJITABELPEL" })
    .returning();
  await db.insert(academicPeriods).values({
    startYear: 3150,
    term: "odd",
    startsOn: "3150-08-01",
    endsOn: "3151-01-31",
  });
  if (!account || !program) throw new Error("The records were not added.");
  const [student] = await db
    .insert(students)
    .values({
      nim: "9982010001",
      name: "Mahasiswa Uji Tabel Pelanggaran",
      studyProgramId: program.id,
      entryPath: "regular",
      sex: "female",
      cohortYear: 3150,
    })
    .returning();
  if (!student) throw new Error("The student was not added.");
  return { accountId: account.id, studentId: student.id };
}

function addViolation(
  db: Database,
  of: Records,
  more: Partial<typeof dormViolations.$inferInsert> = {},
) {
  return db
    .insert(dormViolations)
    .values({
      batchId: crypto.randomUUID(),
      studentId: of.studentId,
      dorm: "dana_rakca",
      day: "3150-10-12",
      reason: "Terlambat apel pagi",
      punishment: "warning",
      announcedAt: ANNOUNCED,
      enteredBy: of.accountId,
      enteredAt: ENTERED,
      ...more,
    })
    .returning();
}

/** In a transaction of its own, so a refusal does not end the check's. */
function inOwnStep<Answer>(db: Database, step: (tx: Database) => Answer) {
  return db.transaction(async (tx) => step(tx));
}

async function addLogLine(db: Database): Promise<{ id: string; of: string }> {
  const records = await addRecords(db);
  const [violation] = await addViolation(db, records);
  if (!violation) throw new Error("The violation was not added.");
  const [line] = await db
    .insert(dormViolationChanges)
    .values({
      violationId: violation.id,
      changedBy: records.accountId,
      action: "entered",
    })
    .returning();
  if (!line) throw new Error("The log line was not added.");
  return { id: line.id, of: violation.id };
}

describe("a dorm violation", () => {
  it("is refused a reason under 3 or over 200 letters", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      for (const reason of ["ab", "a".repeat(201)]) {
        await expect(
          inOwnStep(db, (tx) => addViolation(tx, records, { reason })),
        ).rejects.toThrow();
      }
      await expect(
        addViolation(db, records, { reason: "abc" }),
      ).resolves.toHaveLength(1);
    });
  });

  it("says what Hukuman lainnya is, and holds no such words for another punishment", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        inOwnStep(db, (tx) =>
          addViolation(tx, records, { punishment: "other" }),
        ),
      ).rejects.toThrow();
      await expect(
        inOwnStep(db, (tx) =>
          addViolation(tx, records, { otherPunishment: "Menyapu aula" }),
        ),
      ).rejects.toThrow();
      await expect(
        addViolation(db, records, {
          punishment: "other",
          otherPunishment: "Menyapu aula",
        }),
      ).resolves.toHaveLength(1);
    });
  });

  it("is refused an announcement on a campus day before the violation", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      // 23:59 on campus on 11 October 3150.
      const dayBefore = new Date("3150-10-11T16:59:00Z");

      await expect(
        inOwnStep(db, (tx) =>
          addViolation(tx, records, {
            announcedAt: dayBefore,
            enteredAt: dayBefore,
            day: "3150-10-12",
          }),
        ),
      ).rejects.toThrow();
      // 00:00 on campus on 12 October 3150.
      const sameDay = new Date("3150-10-11T17:00:00Z");
      await expect(
        addViolation(db, records, { announcedAt: sameDay, enteredAt: sameDay }),
      ).resolves.toHaveLength(1);
    });
  });

  it("is refused a violation day after the day it was recorded", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        inOwnStep(db, (tx) => addViolation(tx, records, { day: "3150-10-13" })),
      ).rejects.toThrow();
    });
  });

  it("is cancelled only with who and when together, and only before its announcement", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const before = new Date(ANNOUNCED.getTime() - 1000);

      await expect(
        inOwnStep(db, (tx) =>
          addViolation(tx, records, { cancelledAt: before }),
        ),
      ).rejects.toThrow();
      await expect(
        inOwnStep(db, (tx) =>
          addViolation(tx, records, {
            cancelledAt: ANNOUNCED,
            cancelledBy: records.accountId,
          }),
        ),
      ).rejects.toThrow();
      await expect(
        addViolation(db, records, {
          cancelledAt: before,
          cancelledBy: records.accountId,
        }),
      ).resolves.toHaveLength(1);
    });
  });

  it("cannot be deleted once it has a log line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const removal = db
        .delete(dormViolations)
        .where(eq(dormViolations.id, line.of));
      await expect(removal).rejects.toThrow();
    });
  });
});

describe("the log of dorm violations", () => {
  it("refuses to change a line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const change = db
        .update(dormViolationChanges)
        .set({ action: "cancelled" })
        .where(eq(dormViolationChanges.id, line.id));
      await expect(change).rejects.toThrow();
    });
  });

  it("refuses to delete a line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const removal = db
        .delete(dormViolationChanges)
        .where(eq(dormViolationChanges.id, line.id));
      await expect(removal).rejects.toThrow();
    });
  });

  it("refuses to be emptied", async () => {
    await inTestDatabase(async (db) => {
      await addLogLine(db);
      await expect(
        db.execute(sql`truncate dorm_violation_changes`),
      ).rejects.toThrow();
    });
  });
});
