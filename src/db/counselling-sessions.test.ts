// Sample NIMs of this file: 9986307000 to 9986307099.
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "./connect";
import {
  accounts,
  counsellingSchedules,
  counsellingSessionChanges,
  counsellingSessionReads,
  counsellingSessions,
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
    .values({ name: "Akun Uji Sesi Konseling" })
    .returning();
  const [program] = await db
    .insert(studyPrograms)
    .values({ name: "Prodi Uji Sesi Konseling", code: "UJISESIKONS" })
    .returning();
  if (!account || !program) throw new Error("The records were not added.");
  const [student] = await db
    .insert(students)
    .values({
      nim: "9986307001",
      name: "Mahasiswa Uji Sesi Konseling",
      studyProgramId: program.id,
      entryPath: "regular",
      sex: "female",
      cohortYear: 2026,
    })
    .returning();
  if (!student) throw new Error("The records were not added.");
  return { studentId: student.id, accountId: account.id };
}

function addSession(
  db: Database,
  of: Records,
  values: Partial<typeof counsellingSessions.$inferInsert> = {},
) {
  const now = new Date();
  return db
    .insert(counsellingSessions)
    .values({
      studentId: of.studentId,
      day: "2026-10-19",
      kind: "individual_in_person",
      topic: "academic",
      notes: "Catatan uji.",
      followUp: "monitoring",
      writtenBy: of.accountId,
      writtenAt: now,
      changedBy: of.accountId,
      changedAt: now,
      ...values,
    })
    .returning();
}

async function addSchedule(db: Database, of: Records): Promise<string> {
  const now = new Date();
  const [schedule] = await db
    .insert(counsellingSchedules)
    .values({
      studentId: of.studentId,
      kind: "voluntary",
      status: "done",
      topic: "academic",
      day: "2026-10-19",
      hour: "08:30",
      way: "in_person",
      counsellorId: of.accountId,
      createdAt: now,
      changedBy: of.accountId,
      changedAt: now,
    })
    .returning();
  if (!schedule) throw new Error("The schedule was not added.");
  return schedule.id;
}

async function addLogLine(db: Database): Promise<{ id: string; of: string }> {
  const records = await addRecords(db);
  const [session] = await addSession(db, records);
  if (!session) throw new Error("The session was not added.");
  const [line] = await db
    .insert(counsellingSessionChanges)
    .values({
      sessionId: session.id,
      changedBy: records.accountId,
      changedAt: session.changedAt,
      step: "write",
      before: null,
      after: {
        day: session.day,
        kind: session.kind,
        topic: session.topic,
        notes: session.notes,
        followUp: session.followUp,
        nextDay: session.nextDay,
      },
    })
    .returning();
  if (!line) throw new Error("The log line was not added.");
  return { id: line.id, of: session.id };
}

describe("a counselling session", () => {
  it("keeps its day, Jenis, Topik, notes, Tindak lanjut and Sesi berikutnya", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const [kept] = await addSession(db, records, {
        kind: "group",
        topic: "family",
        followUp: "next_session",
        nextDay: "2026-10-26",
      });

      expect(kept).toMatchObject({
        day: "2026-10-19",
        kind: "group",
        topic: "family",
        notes: "Catatan uji.",
        followUp: "next_session",
        nextDay: "2026-10-26",
      });
    });
  });

  it("is refused empty notes, also notes of spaces only", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(addSession(db, records, { notes: "   " })).rejects.toThrow();
    });
  });

  it("is refused notes longer than 5000 characters", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        addSession(db, records, { notes: "a".repeat(5001) }),
      ).rejects.toThrow();
    });
  });

  it("is refused a next session before its day", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        addSession(db, records, { nextDay: "2026-10-18" }),
      ).rejects.toThrow();
    });
  });

  it("is refused a Jenis that is not one of the three", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        db.execute(sql`
          insert into counselling_sessions
            (student_id, day, kind, topic, notes, follow_up, written_by, written_at, changed_by, changed_at)
          values (${records.studentId}, '2026-10-19', 'phone', 'academic',
            'Catatan uji.', 'monitoring', ${records.accountId}, now(), ${records.accountId}, now())`),
      ).rejects.toThrow();
    });
  });

  it("is one at most for a schedule, and any number with no schedule", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const scheduleId = await addSchedule(db, records);
      await addSession(db, records, { scheduleId });
      await addSession(db, records);
      await addSession(db, records);

      await expect(addSession(db, records, { scheduleId })).rejects.toThrow();
    });
  });

  it("cannot be deleted once it has a log line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const removal = db
        .delete(counsellingSessions)
        .where(eq(counsellingSessions.id, line.of));
      await expect(removal).rejects.toThrow();
    });
  });
});

describe("the log of counselling sessions", () => {
  it("refuses a change of a line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const change = db
        .update(counsellingSessionChanges)
        .set({ step: "change" })
        .where(eq(counsellingSessionChanges.id, line.id));
      await expect(change).rejects.toThrow();
    });
  });

  it("refuses the deletion of a line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const removal = db
        .delete(counsellingSessionChanges)
        .where(eq(counsellingSessionChanges.id, line.id));
      await expect(removal).rejects.toThrow();
    });
  });

  it("refuses to be emptied", async () => {
    await inTestDatabase(async (db) => {
      await addLogLine(db);
      await expect(
        db.execute(sql`truncate counselling_session_changes cascade`),
      ).rejects.toThrow();
    });
  });
});

describe("the log of who read counselling sessions", () => {
  async function addRead(db: Database): Promise<string> {
    const records = await addRecords(db);
    const [line] = await db
      .insert(counsellingSessionReads)
      .values({
        studentId: records.studentId,
        readBy: records.accountId,
        readAt: new Date(),
      })
      .returning();
    if (!line) throw new Error("The read was not added.");
    return line.id;
  }

  it("refuses a change of a line", async () => {
    await inTestDatabase(async (db) => {
      const id = await addRead(db);
      const change = db
        .update(counsellingSessionReads)
        .set({ readAt: new Date() })
        .where(eq(counsellingSessionReads.id, id));
      await expect(change).rejects.toThrow();
    });
  });

  it("refuses the deletion of a line", async () => {
    await inTestDatabase(async (db) => {
      const id = await addRead(db);
      const removal = db
        .delete(counsellingSessionReads)
        .where(eq(counsellingSessionReads.id, id));
      await expect(removal).rejects.toThrow();
    });
  });

  it("refuses to be emptied", async () => {
    await inTestDatabase(async (db) => {
      await addRead(db);
      await expect(
        db.execute(sql`truncate counselling_session_reads cascade`),
      ).rejects.toThrow();
    });
  });
});
