// Sample NIMs of this file: 9986310000 to 9986310099.
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "./connect";
import {
  accounts,
  counsellingSharingChanges,
  counsellingSharings,
  students,
  studyPrograms,
} from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

interface Records {
  studentId: string;
  accountId: string;
}

async function addRecords(db: Database): Promise<Records> {
  const [account] = await db
    .insert(accounts)
    .values({ name: "Akun Uji Berbagi Konseling" })
    .returning();
  const [program] = await db
    .insert(studyPrograms)
    .values({ name: "Prodi Uji Berbagi Konseling", code: "UJIBAGIKONS" })
    .returning();
  if (!account || !program) throw new Error("The records were not added.");
  const [student] = await db
    .insert(students)
    .values({
      nim: "9986310001",
      name: "Mahasiswa Uji Berbagi Konseling",
      studyProgramId: program.id,
      entryPath: "regular",
      sex: "female",
      cohortYear: 2026,
    })
    .returning();
  if (!student) throw new Error("The records were not added.");
  return { studentId: student.id, accountId: account.id };
}

function addSharing(
  db: Database,
  of: Records,
  values: Partial<typeof counsellingSharings.$inferInsert> = {},
) {
  const now = new Date();
  return db
    .insert(counsellingSharings)
    .values({
      studentId: of.studentId,
      status: "waiting",
      data: ["counselling"],
      recipients: ["mentor"],
      askedBy: of.accountId,
      askedAt: now,
      changedBy: of.accountId,
      changedAt: now,
      ...values,
    })
    .returning();
}

async function addedSharing(db: Database, of: Records): Promise<string> {
  const [sharing] = await addSharing(db, of);
  if (!sharing) throw new Error("The sharing was not added.");
  return sharing.id;
}

describe("the sharings of counselling data", () => {
  it("keep at most one current sharing of a student", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addSharing(db, records);
      await expect(
        addSharing(db, records, {
          status: "approved",
          way: "online",
        }),
      ).rejects.toThrow();
    });
  });

  it("take a new request once the last one ended", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addSharing(db, records, { status: "declined" });
      await addSharing(db, records, { status: "cancelled" });
      const [added] = await addSharing(db, records);
      expect(added?.status).toBe("waiting");
    });
  });

  it("refuse a sharing with no data or no recipient", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await expect(addSharing(db, records, { data: [] })).rejects.toThrow();
    });
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await expect(
        addSharing(db, records, { recipients: [] }),
      ).rejects.toThrow();
    });
  });

  it("hold a summary only when it is shared, of at least 10 letters", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await expect(
        addSharing(db, records, { summary: "Ringkasan tanpa dipilih." }),
      ).rejects.toThrow();
    });
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await expect(
        addSharing(db, records, { data: ["summary"], summary: "Pendek" }),
      ).rejects.toThrow();
    });
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const [added] = await addSharing(db, records, {
        data: ["summary"],
        summary: "Mahasiswa sedang dalam pendampingan rutin.",
      });
      expect(added?.summary).toBe("Mahasiswa sedang dalam pendampingan rutin.");
    });
  });

  it("refuse an approved or published sharing without how it was approved, and a published one without who published it", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await expect(
        addSharing(db, records, { status: "approved" }),
      ).rejects.toThrow();
    });
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await expect(
        addSharing(db, records, { status: "published", way: "online" }),
      ).rejects.toThrow();
    });
  });

  it("refuse a change of what is shared with whom, but take a new status", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const id = await addedSharing(db, records);
      await db
        .update(counsellingSharings)
        .set({ status: "approved", way: "paper" })
        .where(eq(counsellingSharings.id, id));
      const change = db
        .update(counsellingSharings)
        .set({ recipients: ["mentor", "director"] })
        .where(eq(counsellingSharings.id, id));
      await expect(change).rejects.toThrow();
    });
  });
});

describe("the log of sharing counselling data", () => {
  async function addLogLine(db: Database): Promise<string> {
    const records = await addRecords(db);
    const sharingId = await addedSharing(db, records);
    const [line] = await db
      .insert(counsellingSharingChanges)
      .values({
        sharingId,
        changedBy: records.accountId,
        changedAt: new Date(),
        step: "ask",
        statusBefore: null,
        statusAfter: "waiting",
        shared: {
          data: ["counselling"],
          recipients: ["mentor"],
          summary: null,
        },
      })
      .returning();
    if (!line) throw new Error("The log line was not added.");
    return line.id;
  }

  it("refuses a change of a line", async () => {
    await inTestDatabase(async (db) => {
      const id = await addLogLine(db);
      const change = db
        .update(counsellingSharingChanges)
        .set({ statusAfter: "published" })
        .where(eq(counsellingSharingChanges.id, id));
      await expect(change).rejects.toThrow();
    });
  });

  it("refuses the deletion of a line, and of the sharing it holds", async () => {
    await inTestDatabase(async (db) => {
      const id = await addLogLine(db);
      const removal = db
        .delete(counsellingSharingChanges)
        .where(eq(counsellingSharingChanges.id, id));
      await expect(removal).rejects.toThrow();
    });
    await inTestDatabase(async (db) => {
      await addLogLine(db);
      await expect(db.delete(counsellingSharings)).rejects.toThrow();
    });
  });

  it("refuses to be emptied, also with the sharings", async () => {
    await inTestDatabase(async (db) => {
      await addLogLine(db);
      await expect(
        db.execute(sql`truncate counselling_sharing_changes cascade`),
      ).rejects.toThrow();
    });
    await inTestDatabase(async (db) => {
      await addLogLine(db);
      await expect(
        db.execute(sql`truncate counselling_sharings cascade`),
      ).rejects.toThrow();
    });
  });
});
