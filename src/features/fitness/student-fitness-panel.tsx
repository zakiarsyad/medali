import type { AccountForAccess } from "@/auth/access";
import { database } from "@/db/database";
import { readStudentFitness } from "./student-fitness";
import { StudentFitnessView } from "./student-fitness-view";

/**
 * "Kesehatan jasmani" of one student, for the detail of that student. An
 * account without the panel, or a student outside its rows, gets nothing
 * at all.
 */
export async function StudentFitnessPanel({
  account,
  studentId,
}: {
  account: AccountForAccess;
  studentId: string;
}) {
  const fitness = await readStudentFitness(database(), account, studentId);
  if (fitness === null) return null;
  return <StudentFitnessView fitness={fitness} />;
}
