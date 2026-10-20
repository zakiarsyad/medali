// Sample NIMs of this file: 9988600000 to 9988600099.
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { addTestActor, addTestStudents } from "@/features/fitness/test-fitness";
import type { Database } from "./connect";
import { mentalHealthScreeningLog, mentalHealthScreenings } from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

/** In a transaction of its own, so a refusal does not end the check's. */
function inOwnStep<Answer>(db: Database, step: (tx: Database) => Answer) {
  return db.transaction(async (tx) => step(tx));
}

async function addNamed(db: Database, nim: string) {
  const konselor = await addTestActor(db, "Konselor Uji Tabel Asesmen", [
    "counsellor",
  ]);
  const { studentIds } = await addTestStudents(db, `Prodi Uji Asesmen ${nim}`, [
    nim,
  ]);
  const [studentId = ""] = studentIds;
  return { studentId, by: konselor.id };
}

type Screening = typeof mentalHealthScreenings.$inferInsert;

function dass(studentId: string, by: string): Screening {
  return {
    studentId,
    screenedOn: "2026-10-16",
    instrument: "dass21",
    depression: 6,
    anxiety: 3,
    stress: 8,
    srqYes: null,
    selfHarm: false,
    level: "mild",
    note: "",
    savedBy: by,
    savedAt: new Date(),
  };
}

async function addScreening(db: Database, nim: string): Promise<string> {
  const { studentId, by } = await addNamed(db, nim);
  const [added] = await db
    .insert(mentalHealthScreenings)
    .values(dass(studentId, by))
    .returning({ id: mentalHealthScreenings.id });
  if (!added) throw new Error("The screening was not added.");
  return added.id;
}

describe("a mental health screening", () => {
  it("keeps DASS-21 with its three sums, and SRQ-20 with its number of ya", async () => {
    await inTestDatabase(async (db) => {
      const { studentId, by } = await addNamed(db, "9988600001");
      await db.insert(mentalHealthScreenings).values([
        dass(studentId, by),
        {
          ...dass(studentId, by),
          instrument: "srq20",
          depression: null,
          anxiety: null,
          stress: null,
          srqYes: 7,
          level: "moderate",
        },
      ]);
      const kept = await db
        .select({ instrument: mentalHealthScreenings.instrument })
        .from(mentalHealthScreenings)
        .where(eq(mentalHealthScreenings.studentId, studentId));
      expect(kept).toHaveLength(2);
    });
  });

  it.each([
    ["a DASS-21 sum over 21", { depression: 22 }],
    ["a DASS-21 sum under 0", { stress: -1 }],
    ["a DASS-21 with a sum missing", { anxiety: null }],
    ["a DASS-21 with a number of ya", { srqYes: 3 }],
    [
      "an SRQ-20 over 20",
      {
        instrument: "srq20",
        depression: null,
        anxiety: null,
        stress: null,
        srqYes: 21,
      },
    ],
    ["an SRQ-20 with DASS-21 sums", { instrument: "srq20", srqYes: 3 }],
    [
      "a self-harm tick below Sangat berat",
      { selfHarm: true, level: "severe" },
    ],
    ["a note over 1000 characters", { note: "a".repeat(1001) }],
  ] as const)("refuses %s", async (_, wrong) => {
    await inTestDatabase(async (db) => {
      const { studentId, by } = await addNamed(db, "9988600002");
      const kept = inOwnStep(db, (tx) =>
        tx
          .insert(mentalHealthScreenings)
          .values({ ...dass(studentId, by), ...wrong }),
      );
      await expect(kept).rejects.toThrow();
    });
  });

  it("cannot be changed, deleted or emptied", async () => {
    await inTestDatabase(async (db) => {
      const id = await addScreening(db, "9988600003");
      const change = inOwnStep(db, (tx) =>
        tx
          .update(mentalHealthScreenings)
          .set({ note: "Diubah." })
          .where(eq(mentalHealthScreenings.id, id)),
      );
      await expect(change).rejects.toThrow();
      const removal = inOwnStep(db, (tx) =>
        tx
          .delete(mentalHealthScreenings)
          .where(eq(mentalHealthScreenings.id, id)),
      );
      await expect(removal).rejects.toThrow();
      const emptying = inOwnStep(db, (tx) =>
        tx.execute(sql`truncate ${mentalHealthScreenings} cascade`),
      );
      await expect(emptying).rejects.toThrow();
    });
  });
});

describe("the log of mental health screenings", () => {
  async function addLogLine(db: Database, nim: string): Promise<string> {
    const { studentId, by } = await addNamed(db, nim);
    const [line] = await db
      .insert(mentalHealthScreeningLog)
      .values({ studentId, event: "opened", by, at: new Date() })
      .returning({ id: mentalHealthScreeningLog.id });
    if (!line) throw new Error("The log line was not added.");
    return line.id;
  }

  it("refuses to change, delete or empty a line", async () => {
    await inTestDatabase(async (db) => {
      const id = await addLogLine(db, "9988600004");
      const change = inOwnStep(db, (tx) =>
        tx
          .update(mentalHealthScreeningLog)
          .set({ event: "saved" })
          .where(eq(mentalHealthScreeningLog.id, id)),
      );
      await expect(change).rejects.toThrow();
      const removal = inOwnStep(db, (tx) =>
        tx
          .delete(mentalHealthScreeningLog)
          .where(eq(mentalHealthScreeningLog.id, id)),
      );
      await expect(removal).rejects.toThrow();
      const emptying = inOwnStep(db, (tx) =>
        tx.execute(sql`truncate ${mentalHealthScreeningLog}`),
      );
      await expect(emptying).rejects.toThrow();
    });
  });

  it("holds no score, level or note", () => {
    const columns = Object.keys(mentalHealthScreeningLog);
    for (const column of ["depression", "srqYes", "level", "note"]) {
      expect(columns).not.toContain(column);
    }
  });
});
