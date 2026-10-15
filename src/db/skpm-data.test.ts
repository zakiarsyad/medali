// Sample Tahun akademik of this file: 3200 to 3200.
// Sample NIMs of this file: 9985000000 to 9985000099.
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "./connect";
import {
  academicPeriods,
  accounts,
  skpmConversions,
  skpmRows,
  skpmUploadChanges,
  skpmUploads,
  students,
  studyPrograms,
} from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

const FINGERPRINT = "a".repeat(64);

interface Records {
  accountId: string;
  periodId: string;
  studentId: string;
}

async function addRecords(db: Database): Promise<Records> {
  const [account] = await db
    .insert(accounts)
    .values({ name: "Akun Uji Tabel SKPM" })
    .returning();
  const [program] = await db
    .insert(studyPrograms)
    .values({ name: "Prodi Uji Tabel SKPM", code: "UJITABELSKPM" })
    .returning();
  const [period] = await db
    .insert(academicPeriods)
    .values({
      startYear: 3200,
      term: "odd",
      startsOn: "3200-08-01",
      endsOn: "3201-01-31",
    })
    .returning();
  if (!account || !program || !period) {
    throw new Error("The records were not added.");
  }
  const [student] = await db
    .insert(students)
    .values({
      nim: "9985000001",
      name: "Mahasiswa Uji Tabel SKPM",
      studyProgramId: program.id,
      entryPath: "regular",
      sex: "female",
      cohortYear: 3200,
    })
    .returning();
  if (!student) throw new Error("The student was not added.");
  return {
    accountId: account.id,
    periodId: period.id,
    studentId: student.id,
  };
}

function addUpload(
  db: Database,
  of: Records,
  more: Partial<typeof skpmUploads.$inferInsert> = {},
) {
  return db
    .insert(skpmUploads)
    .values({
      id: crypto.randomUUID(),
      fileName: "skpm.csv",
      fingerprint: FINGERPRINT,
      mode: "add",
      periodId: of.periodId,
      rowCount: 1,
      studentCount: 1,
      enteredBy: of.accountId,
      enteredAt: new Date(),
      ...more,
    })
    .returning();
}

async function addRow(
  db: Database,
  of: Records,
  more: Partial<typeof skpmRows.$inferInsert> = {},
) {
  const [upload] = await addUpload(db, of);
  if (!upload) throw new Error("The upload was not added.");
  return db
    .insert(skpmRows)
    .values({
      uploadId: upload.id,
      line: 2,
      studentId: of.studentId,
      activity: "Panitia uji",
      category: "Kepanitiaan",
      points: 8,
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
  const [upload] = await addUpload(db, records);
  if (!upload) throw new Error("The upload was not added.");
  const [line] = await db
    .insert(skpmUploadChanges)
    .values({
      uploadId: upload.id,
      changedBy: records.accountId,
      action: "uploaded",
    })
    .returning();
  if (!line) throw new Error("The log line was not added.");
  return { id: line.id, of: upload.id };
}

async function addConversion(db: Database): Promise<string> {
  const records = await addRecords(db);
  const [conversion] = await db
    .insert(skpmConversions)
    .values({
      pointsForHundred: 40,
      pointsBefore: 50,
      setBy: records.accountId,
      setAt: new Date(),
    })
    .returning();
  if (!conversion) throw new Error("The conversion was not added.");
  return conversion.id;
}

describe("an SKPM row", () => {
  it("is refused points outside 0 to 1000, and keeps two decimals", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      for (const points of [-1, 1000.01]) {
        await expect(
          inOwnStep(db, (tx) => addRow(tx, records, { points })),
        ).rejects.toThrow();
      }
      const [kept] = await addRow(db, records, { points: 2.5 });
      expect(kept?.points).toBe(2.5);
    });
  });

  it("is refused an empty Kegiatan or Kategori, and an empty text where null belongs", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      for (const more of [
        { activity: "" },
        { category: "" },
        { level: "" },
        { activityRole: "" },
        { day: "" },
      ]) {
        await expect(
          inOwnStep(db, (tx) => addRow(tx, records, more)),
        ).rejects.toThrow();
      }
      await expect(
        addRow(db, records, { level: null, activityRole: null, day: null }),
      ).resolves.toHaveLength(1);
    });
  });
});

describe("an SKPM upload", () => {
  it("is removed only with who and when together", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        inOwnStep(db, (tx) =>
          addUpload(tx, records, { removedAt: new Date() }),
        ),
      ).rejects.toThrow();
      await expect(
        addUpload(db, records, {
          removedAt: new Date(),
          removedBy: records.accountId,
        }),
      ).resolves.toHaveLength(1);
    });
  });

  it("holds no more students than rows", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        inOwnStep(db, (tx) =>
          addUpload(tx, records, { rowCount: 1, studentCount: 2 }),
        ),
      ).rejects.toThrow();
    });
  });

  it("cannot be deleted once it has a log line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const removal = db.delete(skpmUploads).where(eq(skpmUploads.id, line.of));
      await expect(removal).rejects.toThrow();
    });
  });
});

describe("the log of SKPM uploads", () => {
  it("refuses to change a line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const change = db
        .update(skpmUploadChanges)
        .set({ action: "removed" })
        .where(eq(skpmUploadChanges.id, line.id));
      await expect(change).rejects.toThrow();
    });
  });

  it("refuses to delete a line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const removal = db
        .delete(skpmUploadChanges)
        .where(eq(skpmUploadChanges.id, line.id));
      await expect(removal).rejects.toThrow();
    });
  });

  it("refuses to be emptied", async () => {
    await inTestDatabase(async (db) => {
      await addLogLine(db);
      await expect(
        db.execute(sql`truncate skpm_upload_changes`),
      ).rejects.toThrow();
    });
  });
});

describe("the settings of Poin untuk nilai 100", () => {
  it("are refused outside 1 to 1000", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      for (const pointsForHundred of [0, 1001]) {
        await expect(
          inOwnStep(db, (tx) =>
            tx.insert(skpmConversions).values({
              pointsForHundred,
              pointsBefore: 50,
              setBy: records.accountId,
              setAt: new Date(),
            }),
          ),
        ).rejects.toThrow();
      }
    });
  });

  it("refuse to change or delete a setting, or to be emptied", async () => {
    await inTestDatabase(async (db) => {
      const id = await addConversion(db);

      await expect(
        inOwnStep(db, (tx) =>
          tx
            .update(skpmConversions)
            .set({ pointsForHundred: 60 })
            .where(eq(skpmConversions.id, id)),
        ),
      ).rejects.toThrow();
      await expect(
        inOwnStep(db, (tx) =>
          tx.delete(skpmConversions).where(eq(skpmConversions.id, id)),
        ),
      ).rejects.toThrow();
      await expect(
        db.execute(sql`truncate skpm_conversions`),
      ).rejects.toThrow();
    });
  });
});
