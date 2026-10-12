import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { STEP_ACTIONS } from "./assignment-steps";

/**
 * The signed-in account when it may prepare a penetapan. Any other is
 * refused before anything of what it sent is read. Each step then checks
 * the right of its own, so preparing does not open the penetapan itself.
 */
export async function preparer(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, STEP_ACTIONS.form)) forbidden();
  return account;
}
