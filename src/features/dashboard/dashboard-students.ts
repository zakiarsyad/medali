import { and, eq, inArray, isNull, type SQL, sql } from "drizzle-orm";
import type { StageCohorts } from "@/academic-periods/stage-cohorts";
import { students } from "@/db/schema";
import { dormInSql } from "@/dorms/resident-condition";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import { type DashboardFilters, NO_AGENCY } from "./dashboard-address";
import { type DormChoice, dormsOf, EVERY_DORM, NO_DORM } from "./dorm-choices";

const NOBODY = sql`false`;

/** Which angkatan is where now, read once for every condition of the filters. */
export interface DashboardCohorts {
  /** The angkatan years in each tahap, for the Tahapan filter. */
  stages: StageCohorts;
  /**
   * The angkatan years in a semester that lives in the dorm, for the
   * Asrama filter. None while no academic period runs.
   */
  dorms: number[];
}

function inStage(
  stageNo: number | null,
  stages: StageCohorts,
): SQL | undefined {
  if (stageNo === null) return undefined;
  const years = stages.get(stageNo) ?? [];
  if (years.length === 0) return NOBODY;
  return inArray(students.cohortYear, [...years]);
}

function fromAgency(agency: string | null): SQL | undefined {
  if (agency === null) return undefined;
  if (agency === NO_AGENCY) return isNull(students.originAgency);
  return eq(students.originAgency, agency);
}

/** The students of an Asrama choice, by the dorm the residents rule gives. */
function ofDorm(
  choice: DormChoice | null,
  dormCohorts: number[],
): SQL | undefined {
  if (choice === null) return undefined;
  const dorm = dormInSql(dormCohorts);
  if (choice === EVERY_DORM) return sql`${dorm} is not null`;
  if (choice === NO_DORM) return sql`${dorm} is null`;
  return inArray(dorm, [...dormsOf(choice)]);
}

/** The conditions of the filters that compare one column with the choice. */
function plainChoices(filters: DashboardFilters): (SQL | undefined)[] {
  const { studyProgramId, entryPath, province } = filters;
  const { affirmation, seedling, international } = filters;
  return [
    studyProgramId === null
      ? undefined
      : eq(students.studyProgramId, studyProgramId),
    entryPath === null ? undefined : eq(students.entryPath, entryPath),
    province === null ? undefined : eq(students.province, province),
    affirmation === null ? undefined : eq(students.isAffirmation, affirmation),
    seedling === null ? undefined : eq(students.isSeedling, seedling),
    international === null
      ? undefined
      : eq(students.isInternational, international),
  ];
}

/**
 * The students every number of the Dashboard counts: the Aktif ones among
 * those the account sees, that match the filters.
 */
export function dashboardStudents(
  visible: SQL,
  filters: DashboardFilters,
  cohorts: DashboardCohorts,
): SQL {
  return (
    and(
      visible,
      ACTIVE_MEMBER,
      inStage(filters.stageNo, cohorts.stages),
      ...plainChoices(filters),
      fromAgency(filters.originAgency),
      ofDorm(filters.dorm, cohorts.dorms),
    ) ?? NOBODY
  );
}
