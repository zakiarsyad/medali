// Sample NIMs of this file: 9986300000 to 9986300099.
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "./connect";
import {
  accounts,
  counsellingConsentChanges,
  counsellingConsents,
  students,
  studyPrograms,
} from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

interface Records {
  studentId: string;
  counsellorId: string;
}

async function addRecords(db: Database): Promise<Records> {
  const [account] = await db
    .insert(accounts)
    .values({ name: "Akun Uji Persetujuan Konseling" })
    .returning();
  const [program] = await db
    .insert(studyPrograms)
    .values({ name: "Prodi Uji Persetujuan", code: "UJIPERSETUJUAN" })
    .returning();
  if (!account || !program) throw new Error("The records were not added.");
  const [student] = await db
    .insert(students)
    .values({
      nim: "9986300001",
      name: "Mahasiswa Uji Persetujuan",
      studyProgramId: program.id,
      entryPath: "regular",
      sex: "female",
      cohortYear: 2026,
    })
    .returning();
  if (!student) throw new Error("The records were not added.");
  return { studentId: student.id, counsellorId: account.id };
}

function addConsent(
  db: Database,
  of: Records,
  values: Partial<typeof counsellingConsents.$inferInsert> = {},
) {
  return db
    .insert(counsellingConsents)
    .values({
      studentId: of.studentId,
      status: "waiting",
      changedBy: of.counsellorId,
      changedAt: new Date(),
      ...values,
    })
    .returning();
}

async function addLogLine(db: Database): Promise<{ id: string; of: string }> {
  const records = await addRecords(db);
  const [consent] = await addConsent(db, records);
  if (!consent) throw new Error("The consent was not added.");
  const [line] = await db
    .insert(counsellingConsentChanges)
    .values({
      consentId: consent.id,
      changedBy: records.counsellorId,
      changedAt: consent.changedAt,
      statusAfter: "waiting",
    })
    .returning();
  if (!line) throw new Error("The log line was not added.");
  return { id: line.id, of: consent.id };
}

describe("a counselling consent", () => {
  it("is refused a second time for one student", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addConsent(db, records);

      await expect(
        addConsent(db, records, { status: "approved", way: "paper" }),
      ).rejects.toThrow();
    });
  });

  it("keeps how a Disetujui was given", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const [kept] = await addConsent(db, records, {
        status: "approved",
        way: "paper",
      });

      expect(kept).toMatchObject({ status: "approved", way: "paper" });
    });
  });

  it("is refused a Disetujui without how it was given", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        addConsent(db, records, { status: "approved" }),
      ).rejects.toThrow();
    });
  });

  it("is refused a way for any other status", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        addConsent(db, records, { status: "declined", way: "online" }),
      ).rejects.toThrow();
    });
  });

  it("cannot be deleted once it has a log line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const removal = db
        .delete(counsellingConsents)
        .where(eq(counsellingConsents.id, line.of));
      await expect(removal).rejects.toThrow();
    });
  });

  it("cannot be emptied, not even together with its log", async () => {
    await inTestDatabase(async (db) => {
      await addLogLine(db);
      await expect(
        db.execute(sql`truncate counselling_consents cascade`),
      ).rejects.toThrow();
    });
  });
});

describe("the log of counselling consents", () => {
  it("keeps who changed a consent, when, the status before and after, and the way", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const [consent] = await addConsent(db, records);
      if (!consent) throw new Error("The consent was not added.");

      const [line] = await db
        .insert(counsellingConsentChanges)
        .values({
          consentId: consent.id,
          changedBy: records.counsellorId,
          changedAt: new Date(),
          statusBefore: "waiting",
          statusAfter: "approved",
          way: "paper",
        })
        .returning();

      expect(line).toMatchObject({
        changedBy: records.counsellorId,
        statusBefore: "waiting",
        statusAfter: "approved",
        way: "paper",
      });
      expect(line?.changedAt).toBeInstanceOf(Date);
    });
  });

  it("refuses to change a line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const change = db
        .update(counsellingConsentChanges)
        .set({ statusAfter: "declined" })
        .where(eq(counsellingConsentChanges.id, line.id));
      await expect(change).rejects.toThrow();
    });
  });

  it("refuses to delete a line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const removal = db
        .delete(counsellingConsentChanges)
        .where(eq(counsellingConsentChanges.id, line.id));
      await expect(removal).rejects.toThrow();
    });
  });

  it("refuses to be emptied", async () => {
    await inTestDatabase(async (db) => {
      await addLogLine(db);
      await expect(
        db.execute(sql`truncate counselling_consent_changes`),
      ).rejects.toThrow();
    });
  });
});
