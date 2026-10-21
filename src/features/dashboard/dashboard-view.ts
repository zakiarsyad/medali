import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { stageCohorts } from "@/academic-periods/stage-cohorts";
import type { Database } from "@/db/connect";
import { listStudyPrograms, type StudyProgram } from "@/db/study-programs";
import type { FitnessLimits } from "@/health-notes/fitness-ids";
import { readFitnessLimits } from "@/health-notes/fitness-limits";
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
import { readPhysical } from "./physical-read";
import type { PhysicalRecap } from "./physical-recap";

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
  physical: PhysicalRecap;
  /** The limits in force, which give each fitness category its scores. */
  fitnessLimits: FitnessLimits;
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
  const [held, programs, { limits }] = await Promise.all([
    readHeldChoices(db, scope.visible),
    scope.picksProgram ? listStudyPrograms(db) : null,
    readFitnessLimits(db),
  ]);
  const filters = knownFilters(asked, {
    stages: period !== null,
    programIds: new Set(programs?.map((program) => program.id)),
    provinces: new Set(held.provinces),
    agencies: new Set([NO_AGENCY, ...held.agencies]),
  });
  const stages = stageCohorts(held.cohortYears, period);
  const counted = dashboardStudents(scope.visible, filters, stages);
  const [counts, achievement, physical] = await Promise.all([
    countChoices(db, scope.visible, filters, stages),
    readAchievement(db, counted, filtersInUse(filters) > 0),
    readPhysical(db, limits, counted, scope.illnesses),
  ]);
  return {
    filters,
    programs,
    stagesShown: period !== null,
    period,
    held,
    counts,
    achievement,
    physical,
    fitnessLimits: limits,
  };
}
