import { campusDay } from "@/academic-periods/campus-day";
import type { AccountForAccess } from "@/auth/access";
import { readStudentGrade } from "@/character-grades/student-grade";
import { database } from "@/db/database";
import { StudentGradeView } from "./student-grade-view";

/**
 * "Nilai karakter (KEP-220)" of one student, for the detail of that
 * student, or its brief. An account without the character panels, a
 * student outside its rows, and a student who is not Aktif get nothing.
 */
export async function StudentGradePanel({
  account,
  studentId,
}: {
  account: AccountForAccess;
  studentId: string;
}) {
  const grade = await readStudentGrade(
    database(),
    account,
    studentId,
    campusDay(),
  );
  if (grade === null) return null;
  return <StudentGradeView grade={grade} />;
}
