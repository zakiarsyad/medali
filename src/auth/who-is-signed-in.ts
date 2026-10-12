import type { Stage } from "@/settings";
import { accountSwitcherOn } from "./account-switcher";
import type { Account } from "./accounts";

/** An account using the app, and the way it got in. */
export interface SignedIn {
  account: Account;
  way: "google" | "switcher";
}

/** What is known about a request, before deciding who is using the app. */
export interface SignInFacts {
  stage: Stage;
  /** The active account of a valid Google session, if there is one. */
  sessionAccount: Account | null;
  /** The active account picked in "Ganti peran", if one was picked. */
  pickedAccount: Account | null;
  /** Kepala Unit, the account "Ganti peran" starts with. */
  defaultAccount: Account | null;
}

/**
 * Who is using the app. Someone signed in with Google uses their own
 * account. Otherwise, only where "Ganti peran" is on, it is the account
 * picked there, or Kepala Unit when none is picked. Anywhere else nobody
 * is signed in, whatever a "Ganti peran" cookie says.
 */
export function whoIsSignedIn(facts: SignInFacts): SignedIn | null {
  if (facts.sessionAccount) {
    return { account: facts.sessionAccount, way: "google" };
  }
  if (!accountSwitcherOn(facts.stage)) return null;
  const account = facts.pickedAccount ?? facts.defaultAccount;
  return account ? { account, way: "switcher" } : null;
}
