import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { stageCohorts } from "@/academic-periods/stage-cohorts";
import type { Database } from "@/db/connect";
import { listStudyPrograms, type StudyProgram } from "@/db/study-programs";
import { type Achievement, readAchievement } from "./achievement-read";
import {
  type DashboardFilters,
  filtersInUse,
  knownFilters,
  NO_AGENCY,
} from "./dashboard-address";
import {
  type ChoiceCounts,
  countChoices,
  type HeldChoices,
  readHeldChoices,
} from "./dashboard-choices";
import type { DashboardScope } from "./dashboard-scope";
import { dashboardStudents } from "./dashboard-students";

/** The running period as the semester rule reads it, or null when none runs. */
export type RunningPeriod = Pick<AcademicPeriod, "startYear" | "term"> | null;

/** What Dashboard pembangunan karakter shows. */
export interface DashboardView {
  /** The filters in use, those the account may not make left out. */
  filters: DashboardFilters;
  /** The program studi it may choose, or null when it may choose none. */
  programs: StudyProgram[] | null;
  /** Whether Tahapan is offered: not while no academic period runs. */
  stagesShown: boolean;
  /** The running period, which gives each cohort its semester. */
  period: RunningPeriod;
  held: HeldChoices;
  counts: ChoiceCounts;
  achievement: Achievement;
}

/**
 * Reads the Dashboard of an account's scope with the filters its address
 * asks for. Every number is worked out by the database.
 */
export async function loadDashboard(
  db: Database,
  scope: DashboardScope,
  asked: DashboardFilters,
  period: RunningPeriod,
): Promise<DashboardView> {
  const [held, programs] = await Promise.all([
    readHeldChoices(db, scope.visible),
    scope.picksProgram ? listStudyPrograms(db) : null,
  ]);
  const filters = knownFilters(asked, {
    stages: period !== null,
    programIds: new Set(programs?.map((program) => program.id)),
    provinces: new Set(held.provinces),
    agencies: new Set([NO_AGENCY, ...held.agencies]),
  });
  const stages = stageCohorts(held.cohortYears, period);
  const [counts, achievement] = await Promise.all([
    countChoices(db, scope.visible, filters, stages),
    readAchievement(
      db,
      dashboardStudents(scope.visible, filters, stages),
      filtersInUse(filters) > 0,
    ),
  ]);
  return {
    filters,
    programs,
    stagesShown: period !== null,
    period,
    held,
    counts,
    achievement,
  };
}
