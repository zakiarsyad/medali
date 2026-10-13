import { type AccountForAccess, mayOpenTab } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isWritableFor } from "./mentees";
import { writeNoteAddress } from "./notes-address";
import { writtenRowsFor } from "./visible-notes";

/**
 * The address of the form "Catatan baru" with one student chosen, for an
 * account that may write a note for that student and may open the tab the
 * form is on, or null for any other: a student's detail shows "Tulis
 * catatan" only with this.
 */
export async function openWriteAddress(
  db: Database,
  account: AccountForAccess,
  studentId: string,
): Promise<string | null> {
  const limit = writtenRowsFor(account);
  if (limit === null) return null;
  if (!mayOpenTab(account.roles, "mentoring", "notes")) return null;
  if (!(await isWritableFor(db, limit, studentId))) return null;
  return writeNoteAddress(studentId);
}
