import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { accountRoles, accounts, sessions, signInLog } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { newSessionToken } from "./session-token";
import { endSession, sessionAccount, startSession } from "./sessions";
import { addTestAccount } from "./test-records";

const inTestDatabase = withTestDatabase();
const NOW = new Date("2026-10-12T08:00:00Z");

function later(hours: number, minutes = 0): Date {
  const milliseconds = (hours * 60 + minutes) * 60 * 1000;
  return new Date(NOW.getTime() + milliseconds);
}

function addBudi(db: Database): Promise<string> {
  return addTestAccount(db, { email: "budi@kampus.example" });
}

async function lastSeenOf(db: Database, accountId: string): Promise<Date[]> {
  const kept = await db
    .select({ lastSeenAt: sessions.lastSeenAt })
    .from(sessions)
    .where(eq(sessions.accountId, accountId));
  return kept.map((session) => session.lastSeenAt);
}

describe("startSession", () => {
  it("keeps the hash of the token, never the token", async () => {
    await inTestDatabase(async (db) => {
      const accountId = await addBudi(db);

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
      const accountId = await addBudi(db);

      const first = await startSession(db, accountId, NOW);
      const second = await startSession(db, accountId, NOW);

      expect(first).not.toBe(second);
      expect((await sessionAccount(db, first, NOW))?.id).toBe(accountId);
      expect((await sessionAccount(db, second, NOW))?.id).toBe(accountId);
    });
  });

  it("clears away the sessions that have expired, and no other", async () => {
    await inTestDatabase(async (db) => {
      const accountId = await addBudi(db);
      await startSession(db, accountId, NOW);
      const fresh = await startSession(db, accountId, later(1));

      await startSession(db, accountId, later(8));

      expect(await lastSeenOf(db, accountId)).toHaveLength(2);
      expect(await sessionAccount(db, fresh, later(8))).not.toBeNull();
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

      const account = await sessionAccount(db, token, NOW);
      expect(account?.roles).toEqual(["mentor", "assessor"]);
    });
  });

  it("gives nobody once the account is removed", async () => {
    await inTestDatabase(async (db) => {
      const accountId = await addBudi(db);
      const token = await startSession(db, accountId, NOW);

      await db
        .update(accounts)
        .set({ deletedAt: NOW })
        .where(eq(accounts.id, accountId));

      expect(await sessionAccount(db, token, NOW)).toBeNull();
    });
  });

  it.each([
    ["a token nobody was given", newSessionToken()],
    ["a text that is not a token", "'; drop table sessions; --"],
    ["an empty text", ""],
  ])("gives nobody for %s", async (_kind, token) => {
    await inTestDatabase(async (db) => {
      await startSession(db, await addBudi(db), NOW);

      expect(await sessionAccount(db, token, NOW)).toBeNull();
    });
  });

  it("gives nobody after 8 hours without a page or an action", async () => {
    await inTestDatabase(async (db) => {
      const token = await startSession(db, await addBudi(db), NOW);

      expect(await sessionAccount(db, token, later(7, 59))).not.toBeNull();
      expect(await sessionAccount(db, token, later(16))).toBeNull();
    });
  });

  it("counts the 8 hours from the last page, not from the sign-in", async () => {
    await inTestDatabase(async (db) => {
      const token = await startSession(db, await addBudi(db), NOW);

      await sessionAccount(db, token, later(7));

      expect(await sessionAccount(db, token, later(14))).not.toBeNull();
    });
  });

  it("does not bring an expired session back to life", async () => {
    await inTestDatabase(async (db) => {
      const token = await startSession(db, await addBudi(db), NOW);

      await sessionAccount(db, token, later(9));

      expect(await sessionAccount(db, token, later(9, 1))).toBeNull();
    });
  });

  it("writes the last use at most once every few minutes", async () => {
    await inTestDatabase(async (db) => {
      const accountId = await addBudi(db);
      const token = await startSession(db, accountId, NOW);

      await sessionAccount(db, token, later(0, 4));
      expect(await lastSeenOf(db, accountId)).toEqual([NOW]);

      await sessionAccount(db, token, later(0, 6));
      expect(await lastSeenOf(db, accountId)).toEqual([later(0, 6)]);
    });
  });
});

describe("endSession", () => {
  it("ends the session and says whose it was", async () => {
    await inTestDatabase(async (db) => {
      const accountId = await addBudi(db);
      const token = await startSession(db, accountId, NOW);

      expect(await endSession(db, token, NOW)).toBe(accountId);
      expect(await sessionAccount(db, token, NOW)).toBeNull();
    });
  });

  it("writes the sign-out to the sign-in log, with the account", async () => {
    await inTestDatabase(async (db) => {
      const accountId = await addBudi(db);
      const token = await startSession(db, accountId, NOW);

      await endSession(db, token, later(1));

      expect(await db.select().from(signInLog)).toMatchObject([
        { result: "signed_out", accountId, happenedAt: later(1) },
      ]);
    });
  });

  it("leaves the person's other sessions open", async () => {
    await inTestDatabase(async (db) => {
      const accountId = await addBudi(db);
      const here = await startSession(db, accountId, NOW);
      const elsewhere = await startSession(db, accountId, NOW);

      await endSession(db, here, NOW);

      expect(await sessionAccount(db, elsewhere, NOW)).not.toBeNull();
    });
  });

  it.each([
    ["a token nobody was given", newSessionToken()],
    ["a text that is not a token", "bukan token"],
  ])("ends nothing for %s", async (_kind, token) => {
    await inTestDatabase(async (db) => {
      const accountId = await addBudi(db);
      await startSession(db, accountId, NOW);

      expect(await endSession(db, token, NOW)).toBeNull();
      expect(await lastSeenOf(db, accountId)).toHaveLength(1);
      expect(await db.select().from(signInLog)).toEqual([]);
    });
  });
});
