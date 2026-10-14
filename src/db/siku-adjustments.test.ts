// Sample Tahun akademik of this file: 2900 to 2900.
// Sample NIMs of this file: 9964090000 to 9964090099.
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "./connect";
import {
  academicPeriods,
  accounts,
  sikuAdjustmentChanges,
  sikuAdjustmentStudents,
  sikuAdjustments,
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
    .values({ name: "Akun Uji Tabel SIKU" })
    .returning();
  const [program] = await db
    .insert(studyPrograms)
    .values({ name: "Prodi Uji Tabel SIKU", code: "UJITABELSIKU" })
    .returning();
  const [period] = await db
    .insert(academicPeriods)
    .values({
      startYear: 2900,
      term: "odd",
      startsOn: "2900-08-01",
      endsOn: "2901-01-31",
    })
    .returning();
  if (!account || !program || !period) {
    throw new Error("The records were not added.");
  }
  const [student] = await db
    .insert(students)
    .values({
      nim: "9964090001",
      name: "Mahasiswa Uji Tabel SIKU",
      studyProgramId: program.id,
      entryPath: "regular",
      sex: "female",
      cohortYear: 2900,
    })
    .returning();
  if (!student) throw new Error("The student was not added.");
  return {
    accountId: account.id,
    periodId: period.id,
    studentId: student.id,
  };
}

function addEntry(
  db: Database,
  of: Records,
  more: Partial<typeof sikuAdjustments.$inferInsert> = {},
) {
  return db
    .insert(sikuAdjustments)
    .values({
      id: crypto.randomUUID(),
      kind: "gain",
      reason: "peer_mentoring",
      points: 2,
      day: "2900-10-12",
      note: "",
      basis: "",
      periodId: of.periodId,
      enteredBy: of.accountId,
      enteredAs: "assessor",
      enteredAt: new Date(),
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
  const [entry] = await addEntry(db, records);
  if (!entry) throw new Error("The entry was not added.");
  await db
    .insert(sikuAdjustmentStudents)
    .values({ adjustmentId: entry.id, studentId: records.studentId });
  const [line] = await db
    .insert(sikuAdjustmentChanges)
    .values({
      adjustmentId: entry.id,
      changedBy: records.accountId,
      action: "entered",
    })
    .returning();
  if (!line) throw new Error("The log line was not added.");
  return { id: line.id, of: entry.id };
}

describe("a SIKU entry", () => {
  it("is refused points outside 1 to 30", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      for (const points of [0, 31]) {
        await expect(
          inOwnStep(db, (tx) => addEntry(tx, records, { points })),
        ).rejects.toThrow();
      }
      await expect(addEntry(db, records, { points: 30 })).resolves.toHaveLength(
        1,
      );
    });
  });

  it("is refused a reason of the other kind", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        inOwnStep(db, (tx) =>
          addEntry(tx, records, { kind: "loss", reason: "peer_mentoring" }),
        ),
      ).rejects.toThrow();
      await expect(
        addEntry(db, records, { kind: "loss", reason: "discipline_penalty" }),
      ).resolves.toHaveLength(1);
    });
  });

  it("holds a basis for a decision of the Direktur, and for no other reason", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const decision = { kind: "loss", reason: "director_decision" } as const;

      await expect(
        inOwnStep(db, (tx) => addEntry(tx, records, decision)),
      ).rejects.toThrow();
      await expect(
        inOwnStep(db, (tx) => addEntry(tx, records, { basis: "SK-01" })),
      ).rejects.toThrow();
      await expect(
        addEntry(db, records, { ...decision, basis: "SK-01" }),
      ).resolves.toHaveLength(1);
    });
  });

  it("is cancelled only with who and when together", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        inOwnStep(db, (tx) =>
          addEntry(tx, records, { cancelledAt: new Date() }),
        ),
      ).rejects.toThrow();
      await expect(
        addEntry(db, records, {
          cancelledAt: new Date(),
          cancelledBy: records.accountId,
        }),
      ).resolves.toHaveLength(1);
    });
  });

  it("names a student once", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const [entry] = await addEntry(db, records);
      if (!entry) throw new Error("The entry was not added.");
      const named = { adjustmentId: entry.id, studentId: records.studentId };

      await db.insert(sikuAdjustmentStudents).values(named);
      await expect(
        inOwnStep(db, (tx) => tx.insert(sikuAdjustmentStudents).values(named)),
      ).rejects.toThrow();
    });
  });

  it("cannot be deleted once it has a log line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const removal = db
        .delete(sikuAdjustments)
        .where(eq(sikuAdjustments.id, line.of));
      await expect(removal).rejects.toThrow();
    });
  });
});

describe("the log of SIKU entries", () => {
  it("refuses to change a line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const change = db
        .update(sikuAdjustmentChanges)
        .set({ action: "cancelled" })
        .where(eq(sikuAdjustmentChanges.id, line.id));
      await expect(change).rejects.toThrow();
    });
  });

  it("refuses to delete a line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const removal = db
        .delete(sikuAdjustmentChanges)
        .where(eq(sikuAdjustmentChanges.id, line.id));
      await expect(removal).rejects.toThrow();
    });
  });

  it("refuses to be emptied", async () => {
    await inTestDatabase(async (db) => {
      await addLogLine(db);
      await expect(
        db.execute(sql`truncate siku_adjustment_changes`),
      ).rejects.toThrow();
    });
  });
});
