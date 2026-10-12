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
import { sessionCookieName } from "./session-token";
import { sessionAccount } from "./sessions";
import { type SignedIn, whoIsSignedIn } from "./who-is-signed-in";

export const ACCOUNT_COOKIE = "medali-account";

/**
 * Who is using the app: see `whoIsSignedIn`, which decides. This only
 * gathers what it decides from. A Google session ends when the person
 * signs out, stays away for 8 hours, or the account is removed.
 */
export const currentSignIn = cache(async (): Promise<SignedIn | null> => {
  // Read before anything else, so that every page asking for the account
  // is built per request and never frozen at build time.
  const jar = await cookies();
  const stage = currentStage();
  const token = jar.get(sessionCookieName(stage))?.value;
  const picked = jar.get(ACCOUNT_COOKIE)?.value;

  const own = token
    ? await sessionAccount(database(), token, new Date())
    : null;
  // The accounts of "Ganti peran" are read only where they can count, to
  // spare the database. Whether they count is still decided below.
  const switcherCounts = !own && accountSwitcherOn(stage);
  const pickedAccount =
    switcherCounts && picked
      ? await findActiveAccount(database(), picked)
      : null;
  const defaultAccount =
    switcherCounts && !pickedAccount
      ? await firstAccountWithRole(database(), "head_of_unit")
      : null;
  return whoIsSignedIn({
    stage,
    sessionAccount: own,
    pickedAccount,
    defaultAccount,
  });
});

export const currentAccount = cache(async (): Promise<Account | null> => {
  const signedIn = await currentSignIn();
  return signedIn?.account ?? null;
});
