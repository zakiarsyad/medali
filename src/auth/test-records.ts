import type { Database } from "@/db/connect";
import { accountRoles, accounts } from "@/db/schema";
import type { RoleId } from "./role-ids";

/** Made-up records for the checks of sign-in. */

interface TestAccount {
  email: string;
  roles?: RoleId[];
  deletedAt?: Date;
}

export async function addTestAccount(
  db: Database,
  { email, roles = ["mentor"], deletedAt }: TestAccount,
): Promise<string> {
  const [account] = await db
    .insert(accounts)
    .values({ name: "Akun Uji", email, deletedAt })
    .returning();
  if (!account) throw new Error("The account was not added.");
  await db
    .insert(accountRoles)
    .values(roles.map((role) => ({ accountId: account.id, role })));
  return account.id;
}
