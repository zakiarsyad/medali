import type { Database } from "@/db/connect";
import type { Parsed } from "@/parsed";
import { findAddedStudent } from "./added-students";
import { changeStudent } from "./change-student";
import type { Actor } from "./input-student";
import type { StudentInput } from "./student-input";

/** The version a form opens with for a student who is not there. */
const FIRST_VERSION = 1;

/**
 * Changes a student the way the form does for the checks that are not
 * about the group or the version: opened on the record as stored now,
 * with the choice left on `mentorGroupId`, no group unless one is given.
 */
export async function changeTestStudent(
  db: Database,
  actor: Actor,
  student: StudentInput,
  mentorGroupId: string | null = null,
): Promise<Parsed<null>> {
  const stored = await findAddedStudent(db, student.nim);
  const version = stored?.version ?? FIRST_VERSION;
  return changeStudent(db, actor, student, { mentorGroupId, version });
}
