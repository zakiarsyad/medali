import type { AccountForAccess } from "@/auth/access";
import { database } from "@/db/database";
import { readStudentCoaching } from "./student-coaching";
import { StudentCoachingView } from "./student-coaching-view";

/**
 * "Pembinaan (level)" of one student, for their whole detail. Nothing at
 * all for a student who is not on the coaching list, for one outside the
 * rows Pembinaan karakter shows the account, and for an account whose
 * roles do not open that tab.
 */
export async function StudentCoachingPanel({
  account,
  studentId,
}: {
  account: AccountForAccess;
  studentId: string;
}) {
  const coaching = await readStudentCoaching(database(), account, studentId);
  if (coaching === null) return null;
  return <StudentCoachingView coaching={coaching} />;
}
