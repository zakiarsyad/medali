import type { AccountForAccess } from "@/auth/access";
import { database } from "@/db/database";
import { readStudentScoreHistory } from "./score-history";
import { ScoreHistoryView } from "./score-history-view";

/**
 * "Riwayat per semester" of one student, for the detail of that student,
 * or its brief. An account without the character panels, or a student
 * outside its rows, gets nothing at all.
 */
export async function ScoreHistoryPanel({
  account,
  studentId,
}: {
  account: AccountForAccess;
  studentId: string;
}) {
  const points = await readStudentScoreHistory(database(), account, studentId);
  if (points === null) return null;
  return <ScoreHistoryView points={points} />;
}
