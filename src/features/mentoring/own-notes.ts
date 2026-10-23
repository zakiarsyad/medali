import { eq } from "drizzle-orm";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { mentoringNotes, students } from "@/db/schema";
import { NEWEST_FIRST, OWN_NOTE, type OwnNote } from "@/mentoring/listed-note";

const RIGHT = "view_own_mentoring_notes";

/**
 * Every mentoring note about the student of the account, for Profil
 * saya, the one saved last first, read anew on each opening. Null, with
 * nothing read, for an account without the right. Which student is never
 * asked from outside: it is the one the account's own rows hold.
 */
export async function readOwnNotes(
  db: Database,
  account: AccountForAccess,
): Promise<OwnNote[] | null> {
  if (!may(account.roles, RIGHT)) return null;
  return db
    .select(OWN_NOTE)
    .from(mentoringNotes)
    .innerJoin(students, eq(students.id, mentoringNotes.studentId))
    .where(visibleTo(rowLimitForAction(account, RIGHT)))
    .orderBy(...NEWEST_FIRST);
}
