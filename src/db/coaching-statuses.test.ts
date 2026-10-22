// Sample NIMs of this file: 9987700000 to 9987700099.
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  addNoteActor,
  addNoteStudents,
} from "@/features/guidance/test-violation-notes";
import type { Database } from "./connect";
import { coachingStatusChanges, coachingStatuses } from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

/** In a transaction of its own, so a refusal does not end the check's. */
function inOwnStep<Answer>(db: Database, step: (tx: Database) => Answer) {
  return db.transaction(async (tx) => step(tx));
}

async function addNamed(db: Database, nim: string) {
  const kepala = await addNoteActor(db, "Kepala Uji Tabel Pembinaan", [
    "head_of_unit",
  ]);
  const { studentIds } = await addNoteStudents(
    db,
    `Prodi Uji Tabel Pembinaan ${nim}`,
    "Mahasiswa Uji Tabel Pembinaan",
    [nim],
  );
  const [studentId = ""] = studentIds;
  return { studentId, by: kepala.id };
}

async function addLogLine(db: Database, nim: string): Promise<string> {
  const { studentId, by } = await addNamed(db, nim);
  const [line] = await db
    .insert(coachingStatusChanges)
    .values({
      studentId,
      statusBefore: "identified",
      noteBefore: "",
      statusAfter: "counselling",
      noteAfter: "Diajak bicara oleh pengasuh.",
      changedBy: by,
      changedAt: new Date(),
    })
    .returning({ id: coachingStatusChanges.id });
  if (!line) throw new Error("The log line was not added.");
  return line.id;
}

describe("a coaching status", () => {
  it("is kept once per student at most, at version 1 with no note when none is given", async () => {
    await inTestDatabase(async (db) => {
      const { studentId, by } = await addNamed(db, "9987700001");
      const status = {
        studentId,
        status: "counselling" as const,
        changedBy: by,
        changedAt: new Date(),
      };
      await db.insert(coachingStatuses).values(status);

      const [kept] = await db
        .select()
        .from(coachingStatuses)
        .where(eq(coachingStatuses.studentId, studentId));
      expect(kept?.version).toBe(1);
      expect(kept?.note).toBe("");
      const again = inOwnStep(db, (tx) =>
        tx.insert(coachingStatuses).values({ ...status, status: "done" }),
      );
      await expect(again).rejects.toThrow();
    });
  });

  it.each([
    ["a note over 300 characters", { note: "a".repeat(301) }],
    ["a version below 1", { version: 0 }],
  ])("refuses %s", async (_, more) => {
    await inTestDatabase(async (db) => {
      const { studentId, by } = await addNamed(db, "9987700002");
      const kept = inOwnStep(db, (tx) =>
        tx.insert(coachingStatuses).values({
          studentId,
          status: "monitoring",
          changedBy: by,
          changedAt: new Date(),
          ...more,
        }),
      );
      await expect(kept).rejects.toThrow();
    });
  });

  it("cannot be deleted, only moved to another status", async () => {
    await inTestDatabase(async (db) => {
      const { studentId, by } = await addNamed(db, "9987700003");
      await db.insert(coachingStatuses).values({
        studentId,
        status: "done",
        changedBy: by,
        changedAt: new Date(),
      });

      const removal = inOwnStep(db, (tx) =>
        tx
          .delete(coachingStatuses)
          .where(eq(coachingStatuses.studentId, studentId)),
      );
      await expect(removal).rejects.toThrow();
      const emptying = inOwnStep(db, (tx) =>
        tx.execute(sql`truncate ${coachingStatuses}`),
      );
      await expect(emptying).rejects.toThrow();
    });
  });
});

describe("the log of coaching statuses", () => {
  it("refuses to change, delete or empty a line", async () => {
    await inTestDatabase(async (db) => {
      const id = await addLogLine(db, "9987700004");

      const change = inOwnStep(db, (tx) =>
        tx
          .update(coachingStatusChanges)
          .set({ statusAfter: "done" })
          .where(eq(coachingStatusChanges.id, id)),
      );
      await expect(change).rejects.toThrow();
      const removal = inOwnStep(db, (tx) =>
        tx
          .delete(coachingStatusChanges)
          .where(eq(coachingStatusChanges.id, id)),
      );
      await expect(removal).rejects.toThrow();
      const emptying = inOwnStep(db, (tx) =>
        tx.execute(sql`truncate ${coachingStatusChanges}`),
      );
      await expect(emptying).rejects.toThrow();
    });
  });

  it("refuses a line where nothing changes", async () => {
    await inTestDatabase(async (db) => {
      const { studentId, by } = await addNamed(db, "9987700005");
      const line = inOwnStep(db, (tx) =>
        tx.insert(coachingStatusChanges).values({
          studentId,
          statusBefore: "monitoring",
          noteBefore: "Dipantau dua minggu.",
          statusAfter: "monitoring",
          noteAfter: "Dipantau dua minggu.",
          changedBy: by,
          changedAt: new Date(),
        }),
      );
      await expect(line).rejects.toThrow();
    });
  });
});
