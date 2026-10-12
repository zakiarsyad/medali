import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { accountRoles, sessions } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { newSessionToken } from "./session-token";
import { sessionAccount, startSession } from "./sessions";
import { addTestAccount } from "./test-records";

const inTestDatabase = withTestDatabase();
const NOW = new Date("2026-10-12T08:00:00Z");

describe("startSession", () => {
  it("keeps the hash of the token, never the token", async () => {
    await inTestDatabase(async (db) => {
      const accountId = await addTestAccount(db, {
        email: "budi@kampus.example",
      });

      const token = await startSession(db, accountId, NOW);

      const kept = await db
        .select()
        .from(sessions)
        .where(eq(sessions.accountId, accountId));
      expect(kept).toHaveLength(1);
      expect(JSON.stringify(kept)).not.toContain(token);
    });
  });

  it("gives each sign-in of one person its own working session", async () => {
    await inTestDatabase(async (db) => {
      const accountId = await addTestAccount(db, {
        email: "budi@kampus.example",
      });

      const first = await startSession(db, accountId, NOW);
      const second = await startSession(db, accountId, NOW);

      expect(first).not.toBe(second);
      expect((await sessionAccount(db, first))?.id).toBe(accountId);
      expect((await sessionAccount(db, second))?.id).toBe(accountId);
    });
  });
});

describe("sessionAccount", () => {
  it("gives the account with the roles it holds now", async () => {
    await inTestDatabase(async (db) => {
      const accountId = await addTestAccount(db, {
        email: "budi@kampus.example",
        roles: ["mentor"],
      });
      const token = await startSession(db, accountId, NOW);

      await db.insert(accountRoles).values({ accountId, role: "assessor" });

      const account = await sessionAccount(db, token);
      expect(account?.roles).toEqual(["mentor", "assessor"]);
    });
  });

  it.each([
    ["a token nobody was given", newSessionToken()],
    ["a text that is not a token", "'; drop table sessions; --"],
    ["an empty text", ""],
  ])("gives nobody for %s", async (_kind, token) => {
    await inTestDatabase(async (db) => {
      const accountId = await addTestAccount(db, {
        email: "budi@kampus.example",
      });
      await startSession(db, accountId, NOW);

      expect(await sessionAccount(db, token)).toBeNull();
    });
  });
});
