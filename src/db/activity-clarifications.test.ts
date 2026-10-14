import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  addTestActivity,
  addTestActor,
  addTestClarification,
  addTestPeriods,
  addTestProgram,
  addTestSchedule,
  addTestStudentAccount,
  TEST_DECIDED_AT,
} from "@/features/activities/test-records";
import type { Database } from "./connect";
import { activityClarificationChanges, activityClarifications } from "./schema";
import { withTestDatabase } from "./test-database";

/*
 * This file's own sample values: the Tahun akademik 2280, the program
 * UJITABELKLAR and the NIMs 9973500000 to 9973500099.
 */

const inTestDatabase = withTestDatabase();

interface Records {
  assessorId: string;
  scheduleId: string;
  studentId: string;
}

async function addRecords(db: Database): Promise<Records> {
  const assessor = await addTestActor(db, "Penilai Uji Tabel Klar", [
    "assessor",
  ]);
  const activityId = await addTestActivity(db, assessor.id);
  const periods = await addTestPeriods(db, 2280);
  const scheduleId = await addTestSchedule(db, {
    activityId,
    academicPeriodId: periods.oddId,
    changedBy: assessor.id,
    startsOn: "2280-09-10",
  });
  const programId = await addTestProgram(db, "UJITABELKLAR");
  const student = await addTestStudentAccount(db, programId, {
    nim: "9973500001",
    name: "Mahasiswa Uji Tabel Klar",
    cohortYear: 2279,
  });
  return { assessorId: assessor.id, scheduleId, studentId: student.studentId };
}

type Clarification = typeof activityClarifications.$inferInsert;

/** In a transaction of its own, so a refusal does not end the check's. */
function adding(
  db: Database,
  records: Records,
  clarification: Partial<Clarification> & { status: Clarification["status"] },
): Promise<string> {
  const { assessorId, scheduleId, studentId } = records;
  return db.transaction((tx) =>
    addTestClarification(tx, assessorId, {
      scheduleId,
      studentId,
      ...clarification,
    }),
  );
}

describe("a clarification of an attendance", () => {
  it("is refused as the second that waits for one student and schedule", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await adding(db, records, { status: "submitted" });

      await expect(
        adding(db, records, { status: "submitted" }),
      ).rejects.toThrow();
      expect(await db.select().from(activityClarifications)).toHaveLength(1);
    });
  });

  it("is kept next to a rejected and an accepted one of the same student and schedule", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await adding(db, records, { status: "rejected" });
      await adding(db, records, { status: "accepted" });
      await adding(db, records, { status: "submitted" });

      expect(await db.select().from(activityClarifications)).toHaveLength(3);
    });
  });

  it("is refused when it waits and is decided", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        adding(db, records, {
          status: "submitted",
          decidedAt: TEST_DECIDED_AT,
        }),
      ).rejects.toThrow();
    });
  });

  it.each([
    ["without the time it was decided", { decidedAt: null }],
    ["without who decided it", { decidedBy: null }],
  ])("is refused when it is rejected %s", async (_kind, wrong) => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        adding(db, records, { status: "rejected", ...wrong }),
      ).rejects.toThrow();
    });
  });

  it.each([
    ["accepted without how", "accepted", null],
    ["accepted as a rejection", "accepted", "rejected"],
    ["accepted as a photo that waits", "accepted", "waiting"],
    ["rejected and accepted as present", "rejected", "valid"],
    ["waiting and accepted as present", "submitted", "valid"],
  ] as const)("is refused when it is %s", async (_kind, status, acceptedAs) => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        adding(db, records, { status, acceptedAs }),
      ).rejects.toThrow();
    });
  });

  it("is kept as accepted as present and as a dispensation", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await adding(db, records, { status: "accepted", acceptedAs: "valid" });
      await adding(db, records, {
        status: "accepted",
        acceptedAs: "dispensation",
      });

      expect(await db.select().from(activityClarifications)).toHaveLength(2);
    });
  });

  it("keeps one file for one clarification only", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const fileKey = "attendance-clarifications/uji";
      await adding(db, records, { status: "rejected", fileKey });

      await expect(
        adding(db, records, { status: "submitted", fileKey }),
      ).rejects.toThrow();
    });
  });

  it("cannot be deleted once it has a log line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const removal = db
        .delete(activityClarifications)
        .where(eq(activityClarifications.id, line.of));
      await expect(removal).rejects.toThrow();
    });
  });
});

async function addLogLine(db: Database): Promise<{ id: string; of: string }> {
  const records = await addRecords(db);
  const clarificationId = await adding(db, records, { status: "rejected" });
  const [line] = await db
    .insert(activityClarificationChanges)
    .values({
      clarificationId,
      changedBy: records.assessorId,
      statusBefore: "submitted",
      statusAfter: "rejected",
      note: "Surat tidak terbaca.",
    })
    .returning();
  if (!line) throw new Error("The log line was not added.");
  return { id: line.id, of: clarificationId };
}

describe("the log of clarification decisions", () => {
  it("keeps who decided, when, the status before and after, how it was accepted and the note", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const clarificationId = await adding(db, records, {
        status: "accepted",
        acceptedAs: "dispensation",
      });

      const [line] = await db
        .insert(activityClarificationChanges)
        .values({
          clarificationId,
          changedBy: records.assessorId,
          statusBefore: "submitted",
          statusAfter: "accepted",
          acceptedAs: "dispensation",
          note: "Surat dokter terlampir.",
        })
        .returning();

      expect(line).toMatchObject({
        clarificationId,
        changedBy: records.assessorId,
        statusBefore: "submitted",
        statusAfter: "accepted",
        acceptedAs: "dispensation",
        note: "Surat dokter terlampir.",
      });
      expect(line?.changedAt).toBeInstanceOf(Date);
    });
  });

  it("refuses to change a line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const change = db
        .update(activityClarificationChanges)
        .set({ note: "" })
        .where(eq(activityClarificationChanges.id, line.id));
      await expect(change).rejects.toThrow();
    });
  });

  it("refuses to delete a line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const removal = db
        .delete(activityClarificationChanges)
        .where(eq(activityClarificationChanges.id, line.id));
      await expect(removal).rejects.toThrow();
    });
  });

  it("refuses to be emptied", async () => {
    await inTestDatabase(async (db) => {
      await addLogLine(db);
      await expect(
        db.execute(sql`truncate activity_clarification_changes`),
      ).rejects.toThrow();
    });
  });
});
