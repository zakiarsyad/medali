import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { accounts } from "@/db/schema";

/** A made-up account for the checks of this area. */
export async function addTestActor(
  db: Database,
  name: string,
  roles: RoleId[],
): Promise<{ id: string; roles: RoleId[] }> {
  const [account] = await db.insert(accounts).values({ name }).returning();
  if (!account) throw new Error("The account was not added.");
  return { id: account.id, roles };
}
