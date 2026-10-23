import type { AccountForAccess } from "@/auth/access";
import { database } from "@/db/database";
import { readOwnPenalties } from "./student-penalties";
import { StudentPenaltiesView } from "./student-penalties-view";

/**
 * "Riwayat pelanggaran disiplin" of the student of the account, for
 * Profil saya, to read only. Nothing at all for a student without a
 * penalty and for an account without the right.
 */
export async function OwnPenaltiesPanel({
  account,
}: {
  account: AccountForAccess;
}) {
  const penalties = await readOwnPenalties(database(), account);
  if (penalties === null || penalties.length === 0) return null;
  return <StudentPenaltiesView penalties={penalties} recordAddress={null} />;
}
