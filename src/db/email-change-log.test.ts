import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "./connect";
import { accounts, emailChanges } from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

async function addLogLine(db: Database): Promise<string> {
  const [account] = await db
    .insert(accounts)
    .values({ name: "Akun Uji" })
    .returning();
  if (!account) throw new Error("The account was not added.");
  const [line] = await db
    .insert(emailChanges)
    .values({
      accountId: account.id,
      changedBy: account.id,
      action: "changed",
      emailBefore: "lama.uji@kampus.example",
      emailAfter: "baru.uji@kampus.example",
    })
    .returning();
  if (!line) throw new Error("The log line was not added.");
  return line.id;
}

describe("the address change log", () => {
  it("refuses to change a line", async () => {
    await inTestDatabase(async (db) => {
      const id = await addLogLine(db);
      const change = db
        .update(emailChanges)
        .set({ emailAfter: "lain.uji@kampus.example" })
        .where(eq(emailChanges.id, id));
      await expect(change).rejects.toThrow();
    });
  });

  it("refuses to delete a line", async () => {
    await inTestDatabase(async (db) => {
      const id = await addLogLine(db);
      const removal = db.delete(emailChanges).where(eq(emailChanges.id, id));
      await expect(removal).rejects.toThrow();
    });
  });

  it("refuses to be emptied", async () => {
    await inTestDatabase(async (db) => {
      await addLogLine(db);
      await expect(db.execute(sql`truncate email_changes`)).rejects.toThrow();
    });
  });
});
