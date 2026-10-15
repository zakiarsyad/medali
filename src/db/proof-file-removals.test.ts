import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "./connect";
import { accounts, proofFileRemovals } from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

async function addLogLine(db: Database): Promise<string> {
  const [account] = await db
    .insert(accounts)
    .values({ name: "Kepala Uji Log Berkas" })
    .returning({ id: accounts.id });
  if (!account) throw new Error("The account was not added.");
  const [line] = await db
    .insert(proofFileRemovals)
    .values({
      removedBy: account.id,
      removedAt: new Date(),
      keepDays: 30,
      attendancePhotos: 1,
      sikuPhotos: 0,
      returnPhotos: 0,
      activityClarificationFiles: 0,
      dormClarificationFiles: 0,
      appealProofs: 0,
    })
    .returning({ id: proofFileRemovals.id });
  if (!line) throw new Error("The line was not added.");
  return line.id;
}

describe("the log of removed proof files", () => {
  it("refuses to change a line", async () => {
    await inTestDatabase(async (db) => {
      const id = await addLogLine(db);
      const change = db
        .update(proofFileRemovals)
        .set({ attendancePhotos: 0 })
        .where(eq(proofFileRemovals.id, id));
      await expect(change).rejects.toThrow();
    });
  });

  it("refuses to delete a line", async () => {
    await inTestDatabase(async (db) => {
      const id = await addLogLine(db);
      const removal = db
        .delete(proofFileRemovals)
        .where(eq(proofFileRemovals.id, id));
      await expect(removal).rejects.toThrow();
    });
  });

  it("refuses to be emptied", async () => {
    await inTestDatabase(async (db) => {
      await addLogLine(db);
      await expect(
        db.execute(sql`truncate proof_file_removals`),
      ).rejects.toThrow();
    });
  });
});
