import { stageNameOf } from "@/academic-periods/stages";
import type { StudentFacts } from "./student-facts";

type ProfileHead = Pick<StudentFacts, "nim" | "studyProgram" | "status">;

/**
 * Where the student is in their studies, or null when there is nothing
 * to say: nobody's semester is known while no academic period runs.
 */
function studyWords(
  status: ProfileHead["status"],
  semester: number | null,
): string | null {
  if (status !== "active") return "Tidak aktif";
  if (semester === null) return null;
  return `Semester ${semester}, tahap ${stageNameOf(semester).toLowerCase()}`;
}

/** The line under the student's name on Profil saya. */
export function ownProfileLine(
  student: ProfileHead,
  semester: number | null,
): string {
  const words = [student.nim, student.studyProgram];
  const study = studyWords(student.status, semester);
  if (study !== null) words.push(study);
  return words.join(" · ");
}
