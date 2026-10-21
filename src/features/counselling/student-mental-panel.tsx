import type { AccountForAccess } from "@/auth/access";
import { database } from "@/db/database";
import { readStudentMental } from "./student-mental";
import { StudentMentalView } from "./student-mental-view";

/**
 * "Kesehatan mental" of one student, for the detail of that student, or
 * Konselor's brief. An account that may see none of it, or a student not
 * shared with it, gets nothing at all, with no hint that data exists.
 */
export async function StudentMentalPanel({
  account,
  studentId,
}: {
  account: AccountForAccess;
  studentId: string;
}) {
  const mental = await readStudentMental(database(), account, studentId);
  if (mental === null) return null;
  return <StudentMentalView mental={mental} />;
}
