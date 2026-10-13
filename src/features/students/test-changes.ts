import type { Database } from "@/db/connect";
import type { Parsed } from "@/parsed";
import { changeStudent } from "./change-student";
import type { Actor } from "./input-student";
import type { StudentInput } from "./student-input";

/**
 * Changes a student the way the form does for the checks that are not
 * about the group: with the choice left on `mentorGroupId`, no group
 * unless one is given.
 */
export function changeTestStudent(
  db: Database,
  actor: Actor,
  student: StudentInput,
  mentorGroupId: string | null = null,
): Promise<Parsed<null>> {
  return changeStudent(db, actor, student, { mentorGroupId });
}
