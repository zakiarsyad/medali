import { countDistinct, eq } from "drizzle-orm";
import { type AccountForAccess, may } from "@/auth/access";
import { NOT_REMOVED } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { mentalHealthScreenings, students } from "@/db/schema";
import { shownCount } from "./screening-rules";

/**
 * "Sudah diasesmen" for the whole campus, as Kepala Unit, Direktur,
 * Ketua Program Studi and Pengasuh see it: the same for all four, with
 * no names, and a count of 1 to 4 sent as "<5" only. Null, with nothing
 * read, for an account without the right.
 */
export async function readCampusScreenedCount(
  db: Database,
  actor: AccountForAccess,
): Promise<string | null> {
  if (!may(actor.roles, "view_mental_health_screening_count")) return null;
  const [found] = await db
    .select({ screened: countDistinct(mentalHealthScreenings.studentId) })
    .from(mentalHealthScreenings)
    .innerJoin(students, eq(students.id, mentalHealthScreenings.studentId))
    .where(NOT_REMOVED);
  return shownCount(found?.screened ?? 0);
}
