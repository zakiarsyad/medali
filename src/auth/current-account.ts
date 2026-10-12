import { cookies } from "next/headers";
import { cache } from "react";
import { database } from "@/db/database";
import { currentStage } from "@/settings";
import { accountSwitcherOn } from "./account-switcher";
import {
  type Account,
  findActiveAccount,
  firstAccountWithRole,
} from "./accounts";
import { SESSION_COOKIE } from "./session-token";
import { sessionAccount } from "./sessions";

export const ACCOUNT_COOKIE = "medali-account";

/** An account using the app, and the way it got in. */
export interface SignedIn {
  account: Account;
  way: "google" | "switcher";
}

async function switcherAccount(picked: string | undefined) {
  const db = database();
  const account = picked ? await findActiveAccount(db, picked) : null;
  return account ?? firstAccountWithRole(db, "head_of_unit");
}

/**
 * Who is using the app. Someone signed in with Google uses their own
 * account, until they sign out, stay away for 8 hours, or the account is
 * removed. Otherwise, only where "Ganti peran" is on, it is the account
 * picked there, or Kepala Unit when none is picked. Anywhere else nobody
 * is signed in.
 */
export const currentSignIn = cache(async (): Promise<SignedIn | null> => {
  // Read before anything else, so that every page asking for the account
  // is built per request and never frozen at build time.
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const picked = jar.get(ACCOUNT_COOKIE)?.value;

  const own = token
    ? await sessionAccount(database(), token, new Date())
    : null;
  if (own) return { account: own, way: "google" };
  if (!accountSwitcherOn(currentStage())) return null;
  const account = await switcherAccount(picked);
  return account ? { account, way: "switcher" } : null;
});

export const currentAccount = cache(async (): Promise<Account | null> => {
  const signedIn = await currentSignIn();
  return signedIn?.account ?? null;
});
