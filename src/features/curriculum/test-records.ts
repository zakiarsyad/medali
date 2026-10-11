import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { accounts } from "@/db/schema";
import type { SentPpksActivity } from "./ppks-activity-input";

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

/** A PPKS activity as a form sends it, with nothing wrong in it. */
export const SENT_PPKS_ACTIVITY: SentPpksActivity = {
  semester: "3",
  name: "Kegiatan uji",
  valueKeys: ["M", "D"],
  indicatorCodes: ["M2", "D2"],
  target: "40",
  isRequired: true,
  description: "Deskripsi uji.",
};
