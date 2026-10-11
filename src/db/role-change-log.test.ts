import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "./connect";
import { accounts, roleChanges } from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

async function addLogLine(db: Database): Promise<string> {
  const [account] = await db
    .insert(accounts)
    .values({ name: "Akun Uji" })
    .returning();
  if (!account) throw new Error("The account was not added.");
  const [line] = await db
    .insert(roleChanges)
    .values({
      accountId: account.id,
      changedBy: account.id,
      action: "roles_changed",
      rolesBefore: ["mentor"],
      rolesAfter: ["mentor", "assessor"],
    })
    .returning();
  if (!line) throw new Error("The log line was not added.");
  return line.id;
}

describe("the role change log", () => {
  it("refuses to change a line", async () => {
    await inTestDatabase(async (db) => {
      const id = await addLogLine(db);
      const change = db
        .update(roleChanges)
        .set({ rolesAfter: ["director"] })
        .where(eq(roleChanges.id, id));
      await expect(change).rejects.toThrow();
    });
  });

  it("refuses to delete a line", async () => {
    await inTestDatabase(async (db) => {
      const id = await addLogLine(db);
      const removal = db.delete(roleChanges).where(eq(roleChanges.id, id));
      await expect(removal).rejects.toThrow();
    });
  });

  it("refuses to be emptied", async () => {
    await inTestDatabase(async (db) => {
      await addLogLine(db);
      await expect(db.execute(sql`truncate role_changes`)).rejects.toThrow();
    });
  });
});
