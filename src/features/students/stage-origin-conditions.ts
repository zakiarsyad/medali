import { and, eq, inArray, isNull, ne, type SQL, sql } from "drizzle-orm";
import type { StageCohorts } from "@/academic-periods/stage-cohorts";
import { students } from "@/db/schema";
import { NO_AGENCY } from "./student-list-address";

/** Only Aktif and Cuti students are in a tahap. */
export const HAS_STAGE = ne(students.status, "inactive");

/**
 * The students of a tahap: those in a semester, of an angkatan that is in
 * the tahap now. A tahap no angkatan is in finds nobody.
 */
export function inStage(
  stageNo: number | null,
  cohorts: StageCohorts,
): SQL | undefined {
  if (stageNo === null) return undefined;
  const years = cohorts.get(stageNo) ?? [];
  if (years.length === 0) return sql`false`;
  return and(HAS_STAGE, inArray(students.cohortYear, [...years]));
}

export function fromProvince(province: string | null): SQL | undefined {
  return province === null ? undefined : eq(students.province, province);
}

export function fromAgency(agency: string | null): SQL | undefined {
  if (agency === null) return undefined;
  if (agency === NO_AGENCY) return isNull(students.originAgency);
  return eq(students.originAgency, agency);
}
