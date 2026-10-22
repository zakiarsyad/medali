import type { AccountForAccess } from "@/auth/access";
import { database } from "@/db/database";
import { readRecordAddress, readStudentPenalties } from "./student-penalties";
import { StudentPenaltiesView } from "./student-penalties-view";

/**
 * "Riwayat pelanggaran disiplin" of one student, for their detail or the
 * small detail of Pembina Disiplin Mahasiswa. Nothing at all for a
 * student without a penalty, for one outside the account's rows, and for
 * an account that may not read discipline records. "Catat pelanggaran"
 * only where the account may record a penalty for the student.
 */
export async function StudentPenaltiesPanel({
  account,
  studentId,
}: {
  account: AccountForAccess;
  studentId: string;
}) {
  const db = database();
  const [penalties, recordAddress] = await Promise.all([
    readStudentPenalties(db, account, studentId),
    readRecordAddress(db, account, studentId),
  ]);
  if (penalties === null || penalties.length === 0) return null;
  return (
    <StudentPenaltiesView penalties={penalties} recordAddress={recordAddress} />
  );
}
