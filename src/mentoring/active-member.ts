import { and, type SQL, sql } from "drizzle-orm";
import { students } from "@/db/schema";

/**
 * A member who counts in the size of a group and is held by an attendance
 * list: an Aktif student. A member on Cuti does not count, and neither
 * does one who is Non aktif or was removed.
 */
export const ACTIVE_MEMBER = sql`${students.status} = 'active' and ${students.deletedAt} is null`;

/**
 * The Aktif students among those `visible` lets through: the students
 * the lists of Penilaian hold, and so those a name there may open.
 */
export function activeAmong(visible: SQL): SQL {
  return and(visible, ACTIVE_MEMBER) ?? ACTIVE_MEMBER;
}
