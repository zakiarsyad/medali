// Sample NIMs of this file: 9935000000 to 9935000099.
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import type { Database } from "./connect";
import {
  accounts,
  dormResidentChoiceChanges,
  dormResidentChoices,
} from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

/** In a transaction of its own, so a refusal does not end the check's. */
function inOwnStep<Answer>(db: Database, step: (tx: Database) => Answer) {
  return db.transaction(async (tx) => step(tx));
}

/** A student and an account that a choice and a log line may name. */
async function addNamed(db: Database, nim: string) {
  const program = await addTestProgram(db, `Prodi Uji Pilihan ${nim}`);
  const studentId = await addTestStudent(db, program, { nim, name: "Uji" });
  const [account] = await db
    .insert(accounts)
    .values({ name: "Pengelola Uji" })
    .returning({ id: accounts.id });
  if (!account) throw new Error("The account was not added.");
  return { studentId, by: account.id };
}

async function addLogLine(db: Database, nim: string): Promise<string> {
  const { studentId, by } = await addNamed(db, nim);
  const [line] = await db
    .insert(dormResidentChoiceChanges)
    .values({
      studentId,
      dormBefore: "dana_rakca",
      dormAfter: null,
      changedBy: by,
      changedAt: new Date(),
    })
    .returning({ id: dormResidentChoiceChanges.id });
  if (!line) throw new Error("The log line was not added.");
  return line.id;
}

describe("a dorm resident choice made by hand", () => {
  it("is kept once per student at most", async () => {
    await inTestDatabase(async (db) => {
      const { studentId, by } = await addNamed(db, "9935000001");
      const choice = { studentId, dorm: null, setBy: by, setAt: new Date() };
      await db.insert(dormResidentChoices).values(choice);

      const again = inOwnStep(db, (tx) =>
        tx
          .insert(dormResidentChoices)
          .values({ ...choice, dorm: "dana_rakca" }),
      );

      await expect(again).rejects.toThrow();
    });
  });
});

describe("the log of dorm residents set by hand", () => {
  it("refuses to change a line", async () => {
    await inTestDatabase(async (db) => {
      const id = await addLogLine(db, "9935000002");
      const change = inOwnStep(db, (tx) =>
        tx
          .update(dormResidentChoiceChanges)
          .set({ dormAfter: "cipta_bakti" })
          .where(eq(dormResidentChoiceChanges.id, id)),
      );
      await expect(change).rejects.toThrow();
    });
  });

  it("refuses to delete a line", async () => {
    await inTestDatabase(async (db) => {
      const id = await addLogLine(db, "9935000003");
      const removal = inOwnStep(db, (tx) =>
        tx
          .delete(dormResidentChoiceChanges)
          .where(eq(dormResidentChoiceChanges.id, id)),
      );
      await expect(removal).rejects.toThrow();
    });
  });

  it("refuses to be emptied at once", async () => {
    await inTestDatabase(async (db) => {
      await addLogLine(db, "9935000004");
      const emptying = inOwnStep(db, (tx) =>
        tx.execute(sql`truncate ${dormResidentChoiceChanges}`),
      );
      await expect(emptying).rejects.toThrow();
    });
  });

  it("refuses a line where nothing changes", async () => {
    await inTestDatabase(async (db) => {
      const { studentId, by } = await addNamed(db, "9935000005");
      const line = inOwnStep(db, (tx) =>
        tx.insert(dormResidentChoiceChanges).values({
          studentId,
          dormBefore: null,
          dormAfter: null,
          changedBy: by,
          changedAt: new Date(),
        }),
      );
      await expect(line).rejects.toThrow();
    });
  });
});
