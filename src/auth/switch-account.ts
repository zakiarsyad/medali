"use server";

import { cookies } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import { database } from "@/db/database";
import { currentStage } from "@/settings";
import { accountSwitcherOn } from "./account-switcher";
import { findActiveAccount } from "./accounts";
import { ACCOUNT_COOKIE } from "./current-account";

export async function switchAccount(formData: FormData): Promise<void> {
  if (!accountSwitcherOn(currentStage())) forbidden();
  const picked = formData.get("accountId");
  if (typeof picked !== "string") throw new Error("No account was picked.");
  const account = await findActiveAccount(database(), picked);
  if (!account) throw new Error("The picked account was not found.");

  (await cookies()).set(ACCOUNT_COOKIE, account.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  redirect("/");
}
