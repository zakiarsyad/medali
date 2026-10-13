import { count } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import type { CohortCount } from "./participants";

/**
 * How many Aktif students each angkatan has, read once for a whole page
 * of schedules. Only numbers leave the database, and nobody is named.
 */
export async function readCohortCounts(db: Database): Promise<CohortCount[]> {
  return db
    .select({ cohortYear: students.cohortYear, students: count() })
    .from(students)
    .where(ACTIVE_MEMBER)
    .groupBy(students.cohortYear);
}
