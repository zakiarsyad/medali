import type { AccountForAccess } from "@/auth/access";
import { database } from "@/db/database";
import { readStudentSiku } from "./student-siku";
import { StudentSikuView } from "./student-siku-view";

/**
 * "Rincian nilai SIKU" of one student, for the detail of that student.
 * An account without Penilaian SIKU, or a student that tab does not show
 * it, gets nothing at all.
 */
export async function StudentSikuPanel({
  account,
  studentId,
  base,
}: {
  account: AccountForAccess;
  studentId: string;
  /** Nilai dasar, set in Kurikulum: asked for only when a detail opens. */
  base: Promise<number>;
}) {
  const answer = await readStudentSiku(database(), account, studentId);
  if (answer.kind === "refused") return null;
  return <StudentSikuView base={await base} siku={answer.siku} />;
}
