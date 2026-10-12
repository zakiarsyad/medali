import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "./connect";
import { signInLog } from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

async function addLogLine(db: Database): Promise<string> {
  const [line] = await db
    .insert(signInLog)
    .values({ happenedAt: new Date(), result: "refused_outside_campus" })
    .returning();
  if (!line) throw new Error("The log line was not added.");
  return line.id;
}

describe("the sign-in log", () => {
  it("refuses to change a line", async () => {
    await inTestDatabase(async (db) => {
      const id = await addLogLine(db);
      const change = db
        .update(signInLog)
        .set({ result: "signed_in" })
        .where(eq(signInLog.id, id));
      await expect(change).rejects.toThrow();
    });
  });

  it("refuses to delete a line", async () => {
    await inTestDatabase(async (db) => {
      const id = await addLogLine(db);
      const removal = db.delete(signInLog).where(eq(signInLog.id, id));
      await expect(removal).rejects.toThrow();
    });
  });

  it("refuses to be emptied", async () => {
    await inTestDatabase(async (db) => {
      await addLogLine(db);
      await expect(db.execute(sql`truncate sign_in_log`)).rejects.toThrow();
    });
  });

  it("has no place to keep an address", async () => {
    await inTestDatabase(async (db) => {
      const columns = await db.execute<{ column_name: string }>(
        sql`select column_name from information_schema.columns
            where table_name = 'sign_in_log' order by column_name`,
      );
      expect(columns.map((column) => column.column_name)).toEqual([
        "account_id",
        "happened_at",
        "id",
        "result",
      ]);
    });
  });
});
