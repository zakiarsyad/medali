import { and, count } from "drizzle-orm";
import { heldByStage } from "@/academic-periods/stage-cohorts";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import type { ListCohorts } from "./list-cohorts";
import { HAS_STAGE } from "./stage-origin-conditions";
import { found } from "./student-list";
import { NO_AGENCY, type StudentListFilters } from "./student-list-address";

/** By the number of the tahap. Empty while no academic period runs. */
export async function countStages(
  db: Database,
  limit: RowLimit,
  filters: StudentListFilters,
  cohorts: ListCohorts,
): Promise<Map<number, number>> {
  const others = found(limit, { ...filters, stageNo: null }, cohorts);
  const rows = await db
    .select({ year: students.cohortYear, held: count() })
    .from(students)
    .where(and(others, HAS_STAGE))
    .groupBy(students.cohortYear);
  const heldByCohort = new Map(rows.map((row) => [row.year, row.held]));
  return heldByStage(heldByCohort, cohorts.stages);
}

/** By the name of the provinsi. Students without one are under none. */
export async function countProvinces(
  db: Database,
  limit: RowLimit,
  filters: StudentListFilters,
  cohorts: ListCohorts,
): Promise<Map<string, number>> {
  const rows = await db
    .select({ province: students.province, held: count() })
    .from(students)
    .where(found(limit, { ...filters, province: null }, cohorts))
    .groupBy(students.province);
  const held = new Map<string, number>();
  for (const row of rows) {
    if (row.province !== null) held.set(row.province, row.held);
  }
  return held;
}

/** By the name of the instansi, and by `NO_AGENCY` for students of none. */
export async function countAgencies(
  db: Database,
  limit: RowLimit,
  filters: StudentListFilters,
  cohorts: ListCohorts,
): Promise<Map<string, number>> {
  const rows = await db
    .select({ agency: students.originAgency, held: count() })
    .from(students)
    .where(found(limit, { ...filters, originAgency: null }, cohorts))
    .groupBy(students.originAgency);
  return new Map(rows.map((row) => [row.agency ?? NO_AGENCY, row.held]));
}
