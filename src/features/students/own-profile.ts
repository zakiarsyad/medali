import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import type { Database } from "@/db/connect";
import { type StudentFacts, selectStudentFacts } from "./student-facts";
import { visibleTo } from "./visible-students";

export type OwnProfileAnswer =
  | { kind: "refused" }
  | { kind: "found"; student: StudentFacts };

const REFUSED = { kind: "refused" } as const;

/**
 * The student record of the account itself, for Profil saya. Which student
 * is never asked from outside: it is the one the account's own rows hold.
 * An account without the right is refused, and so is one with the right
 * and no record to show: no student record, or a removed one.
 */
export async function readOwnProfile(
  db: Database,
  account: AccountForAccess,
): Promise<OwnProfileAnswer> {
  if (!may(account.roles, "view_own_profile")) return REFUSED;
  const own = visibleTo(rowLimitForAction(account, "view_own_profile"));
  // Two are asked for so that rows which hold more than the account's own
  // student, as a wider role's would, are refused and not shown.
  const found = await selectStudentFacts(db).where(own).limit(2);
  const [student] = found;
  if (!student || found.length > 1) return REFUSED;
  return { kind: "found", student };
}
