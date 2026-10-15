import { and, eq, type SQL } from "drizzle-orm";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { students, studyPrograms } from "@/db/schema";
import type { RunningPeriod } from "./semester-now";
import {
  readStudentDetail,
  type StudentDetail,
  type StudentDetailAnswer,
} from "./student-detail";

/**
 * The little of a student that a role without the student detail sees
 * when it opens a student from a list of its own: name, NIM, program
 * studi and status.
 */
export type StudentBrief = Pick<
  StudentDetail,
  "id" | "name" | "nim" | "studyProgram" | "status"
>;

/** A student opened from a list of another area: whole, brief, or not found. */
export type DetailOrBrief =
  | Exclude<StudentDetailAnswer, { kind: "refused" }>
  | { kind: "brief"; student: StudentBrief };

const NOT_FOUND = { kind: "not_found" } as const;

async function readStudentBrief(
  db: Database,
  briefVisible: SQL,
  id: string,
): Promise<StudentBrief | undefined> {
  const [student] = await db
    .select({
      id: students.id,
      name: students.name,
      nim: students.nim,
      studyProgram: studyPrograms.name,
      status: students.status,
    })
    .from(students)
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .where(and(eq(students.id, id), briefVisible));
  return student;
}

/**
 * The student a list of another area opens: the whole detail when the
 * account may open it, else the brief when that list shows the student
 * (`briefVisible`), else "not found".
 */
export async function readDetailOrBrief(
  db: Database,
  account: AccountForAccess,
  id: string,
  period: RunningPeriod,
  briefVisible: SQL,
): Promise<DetailOrBrief> {
  const detail = await readStudentDetail(db, account, id, period);
  if (detail.kind === "found") return detail;
  // The database refuses to compare its ids with a text of another shape.
  if (!isUuid(id)) return NOT_FOUND;
  const brief = await readStudentBrief(db, briefVisible, id);
  if (!brief) return NOT_FOUND;
  return { kind: "brief", student: brief };
}
