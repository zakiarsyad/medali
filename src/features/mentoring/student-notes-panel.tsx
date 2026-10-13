import type { SQL } from "drizzle-orm";
import type { AccountForAccess } from "@/auth/access";
import { database } from "@/db/database";
import { openWriteAddress } from "./open-write-address";
import { listStudentNotes } from "./student-notes";
import { StudentNotesView } from "./student-notes-view";

/**
 * "Catatan pengasuhan" of one student, for the detail of that student.
 * An account without the right to read notes gets nothing at all.
 */
export async function StudentNotesPanel({
  account,
  visible,
  studentId,
}: {
  account: AccountForAccess;
  /**
   * The students whose notes the account may read, or null for an
   * account that may read none.
   */
  visible: SQL | null;
  studentId: string;
}) {
  if (visible === null) return null;
  const db = database();
  const [found, writeAddress] = await Promise.all([
    listStudentNotes(db, visible, studentId),
    openWriteAddress(db, account, studentId),
  ]);
  return <StudentNotesView found={found} writeAddress={writeAddress} />;
}
