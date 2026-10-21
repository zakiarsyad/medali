import { and, eq, inArray, isNull, type SQL, sql } from "drizzle-orm";
import type { StageCohorts } from "@/academic-periods/stage-cohorts";
import { students } from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import { type DashboardFilters, NO_AGENCY } from "./dashboard-address";

const NOBODY = sql`false`;

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
  stages: StageCohorts,
): SQL {
  return (
    and(
      visible,
      ACTIVE_MEMBER,
      inStage(filters.stageNo, stages),
      ...plainChoices(filters),
      fromAgency(filters.originAgency),
    ) ?? NOBODY
  );
}
