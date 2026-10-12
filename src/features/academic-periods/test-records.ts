import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { accounts } from "@/db/schema";
import type { SentPeriod } from "./period-input";

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

/** A period as the form sends it, with nothing wrong in it. */
export const SENT_PERIOD: SentPeriod = {
  year: "2026/2027",
  term: "odd",
  startsOn: "2026-08-01",
  endsOn: "2027-01-31",
};
