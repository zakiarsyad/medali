// Sample NIMs of this file: 9986400000 to 9986400099.
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { addTestActor, addTestStudents } from "@/features/fitness/test-fitness";
import type { Database } from "./connect";
import { mentalHealthMarkChanges, mentalHealthMarks } from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

/** In a transaction of its own, so a refusal does not end the check's. */
function inOwnStep<Answer>(db: Database, step: (tx: Database) => Answer) {
  return db.transaction(async (tx) => step(tx));
}

async function addNamed(db: Database, nim: string) {
  const kepala = await addTestActor(db, "Kepala Uji Tabel Penanda", [
    "head_of_unit",
  ]);
  const { studentIds } = await addTestStudents(db, `Prodi Uji Penanda ${nim}`, [
    nim,
  ]);
  const [studentId = ""] = studentIds;
  return { studentId, by: kepala.id };
}

async function addLogLine(db: Database, nim: string): Promise<string> {
  const { studentId, by } = await addNamed(db, nim);
  const [line] = await db
    .insert(mentalHealthMarkChanges)
    .values({
      studentId,
      categoryBefore: null,
      observationBefore: "",
      categoryAfter: "monitor",
      observationAfter: "Sulit tidur.",
      changedBy: by,
      changedAt: new Date(),
    })
    .returning({ id: mentalHealthMarkChanges.id });
  if (!line) throw new Error("The log line was not added.");
  return line.id;
}

describe("a mental health mark", () => {
  it("is kept once per student at most", async () => {
    await inTestDatabase(async (db) => {
      const { studentId, by } = await addNamed(db, "9986400001");
      const mark = {
        studentId,
        category: "monitor" as const,
        observation: "",
        changedBy: by,
        changedAt: new Date(),
      };
      await db.insert(mentalHealthMarks).values(mark);

      const again = inOwnStep(db, (tx) =>
        tx.insert(mentalHealthMarks).values({ ...mark, category: "refer" }),
      );

      await expect(again).rejects.toThrow();
    });
  });

  it.each([
    ["a referral with no observation", "refer", ""],
    ["no indication with an observation", null, "Sulit tidur."],
    ["an observation over 500 characters", "monitor", "a".repeat(501)],
  ] as const)("refuses %s", async (_, category, observation) => {
    await inTestDatabase(async (db) => {
      const { studentId, by } = await addNamed(db, "9986400002");
      const kept = inOwnStep(db, (tx) =>
        tx.insert(mentalHealthMarks).values({
          studentId,
          category,
          observation,
          changedBy: by,
          changedAt: new Date(),
        }),
      );
      await expect(kept).rejects.toThrow();
    });
  });

  it("cannot be deleted, only set back to no indication", async () => {
    await inTestDatabase(async (db) => {
      const { studentId, by } = await addNamed(db, "9986400003");
      await db.insert(mentalHealthMarks).values({
        studentId,
        category: "refer",
        observation: "Menarik diri.",
        changedBy: by,
        changedAt: new Date(),
      });

      const removal = inOwnStep(db, (tx) =>
        tx
          .delete(mentalHealthMarks)
          .where(eq(mentalHealthMarks.studentId, studentId)),
      );
      await expect(removal).rejects.toThrow();
      const emptying = inOwnStep(db, (tx) =>
        tx.execute(sql`truncate ${mentalHealthMarks}`),
      );
      await expect(emptying).rejects.toThrow();

      await db
        .update(mentalHealthMarks)
        .set({ category: null, observation: "" })
        .where(eq(mentalHealthMarks.studentId, studentId));
      const [cleared] = await db
        .select({ category: mentalHealthMarks.category })
        .from(mentalHealthMarks)
        .where(eq(mentalHealthMarks.studentId, studentId));
      expect(cleared).toEqual({ category: null });
    });
  });
});

describe("the log of mental health marks", () => {
  it("refuses to change a line", async () => {
    await inTestDatabase(async (db) => {
      const id = await addLogLine(db, "9986400004");
      const change = inOwnStep(db, (tx) =>
        tx
          .update(mentalHealthMarkChanges)
          .set({ categoryAfter: "refer" })
          .where(eq(mentalHealthMarkChanges.id, id)),
      );
      await expect(change).rejects.toThrow();
    });
  });

  it("refuses to delete a line", async () => {
    await inTestDatabase(async (db) => {
      const id = await addLogLine(db, "9986400005");
      const removal = inOwnStep(db, (tx) =>
        tx
          .delete(mentalHealthMarkChanges)
          .where(eq(mentalHealthMarkChanges.id, id)),
      );
      await expect(removal).rejects.toThrow();
    });
  });

  it("refuses to be emptied at once", async () => {
    await inTestDatabase(async (db) => {
      await addLogLine(db, "9986400006");
      const emptying = inOwnStep(db, (tx) =>
        tx.execute(sql`truncate ${mentalHealthMarkChanges}`),
      );
      await expect(emptying).rejects.toThrow();
    });
  });

  it("refuses a line where nothing changes", async () => {
    await inTestDatabase(async (db) => {
      const { studentId, by } = await addNamed(db, "9986400007");
      const line = inOwnStep(db, (tx) =>
        tx.insert(mentalHealthMarkChanges).values({
          studentId,
          categoryBefore: "monitor",
          observationBefore: "Sulit tidur.",
          categoryAfter: "monitor",
          observationAfter: "Sulit tidur.",
          changedBy: by,
          changedAt: new Date(),
        }),
      );
      await expect(line).rejects.toThrow();
    });
  });
});
