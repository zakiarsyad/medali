import { count } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import type { CohortCount } from "./student-numbers";

/**
 * How many active students each angkatan has, of every program. It holds
 * no names, so it is the same for everyone who opens the page; only a
 * row for each angkatan leaves the database.
 */
export async function readCohortCounts(db: Database): Promise<CohortCount[]> {
  return db
    .select({ cohortYear: students.cohortYear, students: count() })
    .from(students)
    .where(ACTIVE_MEMBER)
    .groupBy(students.cohortYear);
}
