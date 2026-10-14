// Sample NIMs of this file: 9937980000 to 9937980099.
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import { addTestActivity } from "@/features/dorm/test-activities";
import {
  addTestClarification,
  addTestCount,
  TEST_DECIDED_AT,
} from "@/features/dorm/test-clarifications";
import { addTestActor } from "@/features/dorm/test-records";
import type { Database } from "./connect";
import { dormClarificationChanges, dormClarifications } from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

interface Records {
  bamId: string;
  countId: string;
  studentId: string;
}

async function addRecords(db: Database): Promise<Records> {
  const bam = await addTestActor(db, "BAM Uji Tabel Klarifikasi", ["bam_bphk"]);
  const programId = await addTestProgram(db, "Prodi Uji Tabel Klar Asrama");
  const studentId = await addTestStudent(db, programId, {
    nim: "9937980001",
    name: "Penghuni Uji Tabel Klarifikasi",
  });
  const activityId = await addTestActivity(db, bam.id);
  const countId = await addTestCount(db, {
    activityId,
    day: "2026-10-12",
    byId: bam.id,
    marks: { [studentId]: { isAbsent: true, note: "" } },
  });
  return { bamId: bam.id, countId, studentId };
}

type Clarification = typeof dormClarifications.$inferInsert;

/** In a transaction of its own, so a refusal does not end the check's. */
function adding(
  db: Database,
  records: Records,
  clarification: Partial<Clarification> = {},
): Promise<string> {
  const { bamId, countId, studentId } = records;
  return db.transaction((tx) =>
    addTestClarification(tx, bamId, { countId, studentId, ...clarification }),
  );
}

describe("a clarification of a dorm absence", () => {
  it.each([
    ["submitted", "submitted"],
    ["submitted", "verified"],
    ["verified", "submitted"],
  ] as const)(
    "is refused as a second that waits for one resident and count: %s, then %s",
    async (first, second) => {
      await inTestDatabase(async (db) => {
        const records = await addRecords(db);
        await adding(db, records, { status: first });

        await expect(adding(db, records, { status: second })).rejects.toThrow();
        expect(await db.select().from(dormClarifications)).toHaveLength(1);
      });
    },
  );

  it("is kept next to a rejected, an accepted and a closed one of the same resident and count", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await adding(db, records, { status: "rejected" });
      await adding(db, records, { status: "accepted" });
      await adding(db, records, { status: "closed" });
      await adding(db, records, { status: "submitted" });

      expect(await db.select().from(dormClarifications)).toHaveLength(4);
    });
  });

  it("keeps a rejection of Pengelola Asrama after BAM passed it on, with both notes", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await adding(db, records, {
        status: "rejected",
        verifyNote: "",
        decidedBy: records.bamId,
        decidedAt: TEST_DECIDED_AT,
        decisionNote: "Surat tidak sah.",
      });

      expect(await db.select().from(dormClarifications)).toHaveLength(1);
    });
  });

  /** Each wrong row, given who checks and decides. */
  const wrong: [string, (by: string) => Partial<Clarification>][] = [
    [
      "waiting for BAM and already checked",
      (by) => ({
        status: "submitted",
        verifiedBy: by,
        verifiedAt: TEST_DECIDED_AT,
      }),
    ],
    [
      "passed on without who checked it",
      () => ({ status: "verified", verifiedBy: null, verifiedAt: null }),
    ],
    [
      "passed on and decided",
      (by) => ({
        status: "verified",
        decidedBy: by,
        decidedAt: TEST_DECIDED_AT,
      }),
    ],
    [
      "accepted without what it made the resident",
      () => ({ status: "accepted", acceptedAs: null }),
    ],
    [
      "waiting and accepted as present",
      () => ({ status: "submitted", acceptedAs: "present" }),
    ],
    [
      "rejected by BAM without a note",
      () => ({ status: "rejected", verifyNote: "" }),
    ],
    [
      "rejected by Pengelola Asrama without a note of their own",
      (by) => ({
        status: "rejected",
        verifyNote: "Layak diteruskan.",
        decidedBy: by,
        decidedAt: TEST_DECIDED_AT,
        decisionNote: "",
      }),
    ],
    [
      "closed without who closed it",
      () => ({ status: "closed", decidedBy: null, decidedAt: null }),
    ],
    [
      "checked with a note that is too long",
      () => ({ status: "verified", verifyNote: "a".repeat(201) }),
    ],
  ];

  it.each(wrong)("is refused when it is %s", async (_kind, wrongRow) => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        adding(db, records, wrongRow(records.bamId)),
      ).rejects.toThrow();
    });
  });

  it("keeps one file for one clarification only", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const fileKey = "dorm-clarifications/uji";
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
        .delete(dormClarifications)
        .where(eq(dormClarifications.id, line.of));
      await expect(removal).rejects.toThrow();
    });
  });
});

async function addLogLine(db: Database): Promise<{ id: string; of: string }> {
  const records = await addRecords(db);
  const clarificationId = await adding(db, records, { status: "rejected" });
  const [line] = await db
    .insert(dormClarificationChanges)
    .values({
      clarificationId,
      changedBy: records.bamId,
      statusBefore: "submitted",
      statusAfter: "rejected",
      note: "Surat tidak terbaca.",
    })
    .returning();
  if (!line) throw new Error("The log line was not added.");
  return { id: line.id, of: clarificationId };
}

describe("the log of dorm clarification decisions", () => {
  it("keeps who decided, when, the status before and after, what an acceptance made the resident and the note", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const clarificationId = await adding(db, records, {
        status: "accepted",
        acceptedAs: "leave",
      });

      const [line] = await db
        .insert(dormClarificationChanges)
        .values({
          clarificationId,
          changedBy: records.bamId,
          statusBefore: "verified",
          statusAfter: "accepted",
          acceptedAs: "leave",
          note: "Surat keluarga terlampir.",
        })
        .returning();

      expect(line).toMatchObject({
        clarificationId,
        changedBy: records.bamId,
        statusBefore: "verified",
        statusAfter: "accepted",
        acceptedAs: "leave",
        note: "Surat keluarga terlampir.",
      });
      expect(line?.changedAt).toBeInstanceOf(Date);
    });
  });

  it("refuses to change a line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const change = db
        .update(dormClarificationChanges)
        .set({ note: "" })
        .where(eq(dormClarificationChanges.id, line.id));
      await expect(change).rejects.toThrow();
    });
  });

  it("refuses to delete a line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const removal = db
        .delete(dormClarificationChanges)
        .where(eq(dormClarificationChanges.id, line.id));
      await expect(removal).rejects.toThrow();
    });
  });

  it("refuses to be emptied", async () => {
    await inTestDatabase(async (db) => {
      await addLogLine(db);
      await expect(
        db.execute(sql`truncate dorm_clarification_changes`),
      ).rejects.toThrow();
    });
  });
});
