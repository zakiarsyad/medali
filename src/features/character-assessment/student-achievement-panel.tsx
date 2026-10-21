import { campusDay } from "@/academic-periods/campus-day";
import type { AccountForAccess } from "@/auth/access";
import { database } from "@/db/database";
import { readStudentAchievement } from "./student-achievement";
import { StudentAchievementView } from "./student-achievement-view";

/**
 * "Capaian karakter" of one student, for the detail of that student, or
 * its brief. An account without the character panels, or a student
 * outside its rows, gets nothing at all.
 */
export async function StudentAchievementPanel({
  account,
  studentId,
}: {
  account: AccountForAccess;
  studentId: string;
}) {
  const achievement = await readStudentAchievement(
    database(),
    account,
    studentId,
    campusDay(),
  );
  if (achievement === null) return null;
  return <StudentAchievementView achievement={achievement} />;
}
