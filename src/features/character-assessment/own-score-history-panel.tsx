import type { AccountForAccess } from "@/auth/access";
import { database } from "@/db/database";
import { readOwnScoreHistory } from "./score-history";
import { ScoreHistoryView } from "./score-history-view";

/**
 * "Riwayat per semester" of the student of the account, for Profil saya.
 * An account without the right, or without a student record, gets
 * nothing at all.
 */
export async function OwnScoreHistoryPanel({
  account,
}: {
  account: AccountForAccess;
}) {
  const points = await readOwnScoreHistory(database(), account);
  if (points === null) return null;
  return <ScoreHistoryView points={points} />;
}
