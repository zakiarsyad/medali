import { eq, lte } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { sessions } from "@/db/schema";
import { type Account, findActiveAccount } from "./accounts";
import {
  expiredBefore,
  lastSeenNeedsWriting,
  sessionExpired,
} from "./session-rules";
import {
  isSessionToken,
  newSessionToken,
  sessionTokenHash,
} from "./session-token";
import { logSignIn } from "./sign-in-log";

/**
 * Signs an account in, and gives the token its browser will hold. The
 * session and its line in the sign-in log are written together or not at
 * all, so the log never says "signed in" for a session that does not
 * exist. The sessions that have expired are cleared away on the way, so
 * those of people who never came back do not pile up.
 */
export async function startSession(
  db: Database,
  accountId: string,
  now: Date,
): Promise<string> {
  const token = newSessionToken();
  await db.transaction(async (tx) => {
    await tx
      .delete(sessions)
      .where(lte(sessions.lastSeenAt, expiredBefore(now)));
    await tx.insert(sessions).values({
      tokenHash: sessionTokenHash(token),
      accountId,
      lastSeenAt: now,
    });
    await logSignIn(tx, { result: "signed_in", accountId }, now);
  });
  return token;
}

async function noteSeen(db: Database, id: string, now: Date): Promise<void> {
  await db.update(sessions).set({ lastSeenAt: now }).where(eq(sessions.id, id));
}

/**
 * The account signed in with a token, or null when the token is unknown,
 * the session has expired, or its account was removed. The account and
 * its roles are read on every request, so a change to them shows on the
 * person's next page. `token` comes from a cookie and is not trusted.
 */
export async function sessionAccount(
  db: Database,
  token: string,
  now: Date,
): Promise<Account | null> {
  if (!isSessionToken(token)) return null;
  const [session] = await db
    .select({
      id: sessions.id,
      accountId: sessions.accountId,
      lastSeenAt: sessions.lastSeenAt,
    })
    .from(sessions)
    .where(eq(sessions.tokenHash, sessionTokenHash(token)))
    .limit(1);
  if (!session || sessionExpired(session.lastSeenAt, now)) return null;
  const account = await findActiveAccount(db, session.accountId);
  if (!account) return null;
  if (lastSeenNeedsWriting(session.lastSeenAt, now)) {
    await noteSeen(db, session.id, now);
  }
  return account;
}

/**
 * Ends the session of a token, and writes the sign-out to the sign-in
 * log. It gives the account that was signed in, or null when the token
 * opened no session; then nothing is written. The session ends and its
 * line is written together or not at all.
 */
export async function endSession(
  db: Database,
  token: string,
  now: Date,
): Promise<string | null> {
  if (!isSessionToken(token)) return null;
  return db.transaction(async (tx) => {
    const [ended] = await tx
      .delete(sessions)
      .where(eq(sessions.tokenHash, sessionTokenHash(token)))
      .returning({ accountId: sessions.accountId });
    if (!ended) return null;
    await logSignIn(tx, { result: "signed_out", ...ended }, now);
    return ended.accountId;
  });
}
