import { eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { sessions } from "@/db/schema";
import { type Account, findActiveAccount } from "./accounts";
import {
  isSessionToken,
  newSessionToken,
  sessionTokenHash,
} from "./session-token";

/** Signs an account in, and gives the token its browser will hold. */
export async function startSession(
  db: Database,
  accountId: string,
  now: Date,
): Promise<string> {
  const token = newSessionToken();
  await db.insert(sessions).values({
    tokenHash: sessionTokenHash(token),
    accountId,
    createdAt: now,
    lastSeenAt: now,
  });
  return token;
}

/**
 * The account signed in with a token, or null when the token is unknown
 * or its account was removed. The account and its roles are read on every
 * request, so a change to them shows on the person's next page. `token`
 * comes from a cookie and is not trusted.
 */
export async function sessionAccount(
  db: Database,
  token: string,
): Promise<Account | null> {
  if (!isSessionToken(token)) return null;
  const [session] = await db
    .select({ accountId: sessions.accountId })
    .from(sessions)
    .where(eq(sessions.tokenHash, sessionTokenHash(token)))
    .limit(1);
  if (!session) return null;
  return findActiveAccount(db, session.accountId);
}
