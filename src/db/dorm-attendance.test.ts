// Sample NIMs of this file: 9937710000 to 9937710099.
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { NOTE_MAX_LENGTH } from "@/features/dorm/count-ids";
import type { Database } from "./connect";
import {
  accounts,
  dormActivities,
  dormAttendanceChanges,
  dormAttendanceCounts,
  dormAttendanceMarks,
  students,
  studyPrograms,
} from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

interface Records {
  accountId: string;
  activityId: string;
  studentId: string;
}

async function addRecords(db: Database): Promise<Records> {
  const [account] = await db
    .insert(accounts)
    .values({ name: "Akun Uji Tabel Kehadiran Asrama" })
    .returning();
  const [program] = await db
    .insert(studyPrograms)
    .values({ name: "Prodi Uji Kehadiran Asrama", code: "UJIHADIRASR" })
    .returning();
  if (!account || !program) throw new Error("The records were not added.");
  const [activity] = await db
    .insert(dormActivities)
    .values({ changedAt: new Date(), changedBy: account.id })
    .returning();
  const [student] = await db
    .insert(students)
    .values({
      nim: "9937710001",
      name: "Penghuni Uji Tabel",
      studyProgramId: program.id,
      entryPath: "regular",
      sex: "female",
      cohortYear: 2026,
    })
    .returning();
  if (!activity || !student) throw new Error("The records were not added.");
  return {
    accountId: account.id,
    activityId: activity.id,
    studentId: student.id,
  };
}

function addCount(
  db: Database,
  of: Records,
  more: Partial<typeof dormAttendanceCounts.$inferInsert> = {},
) {
  return db
    .insert(dormAttendanceCounts)
    .values({
      activityId: of.activityId,
      day: "2026-10-12",
      savedBy: of.accountId,
      savedAt: new Date(),
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
  const [count] = await addCount(db, records);
  if (!count) throw new Error("The count was not added.");
  const [line] = await db
    .insert(dormAttendanceChanges)
    .values({
      countId: count.id,
      changedBy: records.accountId,
      marksAfter: { [records.studentId]: { isAbsent: true, note: "" } },
    })
    .returning();
  if (!line) throw new Error("The log line was not added.");
  return { id: line.id, of: count.id };
}

describe("a count of a dorm activity", () => {
  it("is kept once for an activity on a day, and once more for another day", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const [first] = await addCount(db, records);

      expect(first).toMatchObject({ version: 1, announcedAt: null });
      await expect(
        inOwnStep(db, (tx) => addCount(tx, records)),
      ).rejects.toThrow();
      await expect(
        addCount(db, records, { day: "2026-10-13" }),
      ).resolves.toHaveLength(1);
    });
  });

  it("is refused an announcement without who or without when", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        inOwnStep(db, (tx) =>
          addCount(tx, records, { announcedBy: records.accountId }),
        ),
      ).rejects.toThrow();
      await expect(
        inOwnStep(db, (tx) =>
          addCount(tx, records, { announcedAt: new Date() }),
        ),
      ).rejects.toThrow();
      await expect(
        addCount(db, records, {
          announcedBy: records.accountId,
          announcedAt: new Date(),
        }),
      ).resolves.toHaveLength(1);
    });
  });

  it("keeps one mark for a student, with a note of at most 200 characters", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const [count] = await addCount(db, records);
      if (!count) throw new Error("The count was not added.");
      const mark = { countId: count.id, studentId: records.studentId };
      const longest = "a".repeat(NOTE_MAX_LENGTH);

      await expect(
        inOwnStep(db, (tx) =>
          tx
            .insert(dormAttendanceMarks)
            .values({ ...mark, isAbsent: true, note: `${longest}a` }),
        ),
      ).rejects.toThrow();
      await db
        .insert(dormAttendanceMarks)
        .values({ ...mark, isAbsent: true, note: longest });
      await expect(
        inOwnStep(db, (tx) =>
          tx
            .insert(dormAttendanceMarks)
            .values({ ...mark, isAbsent: false, note: "" }),
        ),
      ).rejects.toThrow();
    });
  });

  it("cannot be deleted once it has a log line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const removal = db
        .delete(dormAttendanceCounts)
        .where(eq(dormAttendanceCounts.id, line.of));
      await expect(removal).rejects.toThrow();
    });
  });

  it("cannot be emptied, not even together with its log", async () => {
    await inTestDatabase(async (db) => {
      await addLogLine(db);
      await expect(
        db.execute(sql`truncate dorm_attendance_counts cascade`),
      ).rejects.toThrow();
    });
  });
});

describe("the log of dorm attendance announcements", () => {
  it("refuses to change a line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const change = db
        .update(dormAttendanceChanges)
        .set({ marksAfter: {} })
        .where(eq(dormAttendanceChanges.id, line.id));
      await expect(change).rejects.toThrow();
    });
  });

  it("refuses to delete a line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const removal = db
        .delete(dormAttendanceChanges)
        .where(eq(dormAttendanceChanges.id, line.id));
      await expect(removal).rejects.toThrow();
    });
  });

  it("refuses to be emptied", async () => {
    await inTestDatabase(async (db) => {
      await addLogLine(db);
      await expect(
        db.execute(sql`truncate dorm_attendance_changes`),
      ).rejects.toThrow();
    });
  });
});
