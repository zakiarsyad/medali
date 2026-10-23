import type { AccountForAccess } from "@/auth/access";
import { database } from "@/db/database";
import { readOwnCoaching } from "./student-coaching";
import { StudentCoachingView } from "./student-coaching-view";

/**
 * "Pembinaan (level)" of the student of the account, for Profil saya, to
 * read only. Nothing at all with no pembinaan, with one that is Selesai,
 * and for an account without the right.
 */
export async function OwnCoachingPanel({
  account,
}: {
  account: AccountForAccess;
}) {
  const coaching = await readOwnCoaching(database(), account);
  if (coaching === null) return null;
  return <StudentCoachingView coaching={coaching} forStudent />;
}
