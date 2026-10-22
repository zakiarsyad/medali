import type { AccountForAccess } from "@/auth/access";
import { database } from "@/db/database";
import { readStudentPenalties } from "./student-penalties";
import { StudentPenaltiesView } from "./student-penalties-view";

/**
 * "Riwayat pelanggaran disiplin" of one student, for their detail or the
 * small detail of Pembina Disiplin Mahasiswa. Nothing at all for a
 * student without a penalty, for one outside the account's rows, and for
 * an account that may not read discipline records.
 */
export async function StudentPenaltiesPanel({
  account,
  studentId,
}: {
  account: AccountForAccess;
  studentId: string;
}) {
  const penalties = await readStudentPenalties(database(), account, studentId);
  if (penalties === null || penalties.length === 0) return null;
  return <StudentPenaltiesView penalties={penalties} />;
}
