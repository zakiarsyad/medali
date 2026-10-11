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

export const ACCOUNT_COOKIE = "medali-account";

/**
 * The account using the app. Until sign-in is built, it is the account
 * picked in "Ganti peran", or Kepala Unit when none is picked. Where the
 * switcher is off, nobody is signed in.
 */
export const currentAccount = cache(async (): Promise<Account | null> => {
  // Read before anything else, so that every page asking for the account
  // is built per request and never frozen at build time.
  const picked = (await cookies()).get(ACCOUNT_COOKIE)?.value;
  if (!accountSwitcherOn(currentStage())) return null;
  const db = database();
  const account = picked ? await findActiveAccount(db, picked) : null;
  return account ?? firstAccountWithRole(db, "head_of_unit");
});
