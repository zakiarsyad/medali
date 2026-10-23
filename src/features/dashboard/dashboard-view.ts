import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { stageCohorts } from "@/academic-periods/stage-cohorts";
import {
  type GradeBasis,
  readGradeBasis,
} from "@/character-grades/grade-facts";
import { readGradeScheme } from "@/character-grades/grade-scheme";
import type { Database } from "@/db/connect";
import { listStudyPrograms, type StudyProgram } from "@/db/study-programs";
import type { FitnessLimits } from "@/health-notes/fitness-ids";
import { readFitnessLimits } from "@/health-notes/fitness-limits";
import type { PhysicalRecap } from "@/health-notes/fitness-recap";
import { readPhysical } from "@/health-notes/fitness-recap-read";
import type { MentalView } from "@/mental-health/mental-recap";
import { readMental } from "@/mental-health/mental-recap-read";
import { type Achievement, readAchievement } from "./achievement-read";
import {
  type DashboardFilters,
  filtersInUse,
  knownFilters,
  NO_AGENCY,
  NO_FILTERS,
} from "./dashboard-address";
import {
  type ChoiceCounts,
  countChoices,
  type HeldChoices,
  readHeldChoices,
} from "./dashboard-choices";
import type { DashboardScope } from "./dashboard-scope";
import { dashboardStudents } from "./dashboard-students";
import { type CharacterGrades, readCharacterGrades } from "./grade-read";
import { readMentoring } from "./mentoring-read";
import type { MentoringView } from "./mentoring-recap";

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
  grades: CharacterGrades;
  physical: PhysicalRecap;
  mental: MentalView;
  mentoring: MentoringView;
  /** The limits in force, which give each fitness category its scores. */
  fitnessLimits: FitnessLimits;
}

/** What the grades are worked out with on `today`, by the scheme in force. */
export async function readBasis(
  db: Database,
  today: string,
): Promise<GradeBasis> {
  const { scheme } = await readGradeScheme(db);
  return readGradeBasis(db, scheme, today);
}

/**
 * Reads the Dashboard of an account's scope with the filters its address
 * asks for, the grades as they stand on `today`. Every number is worked
 * out by the database.
 */
export async function loadDashboard(
  db: Database,
  scope: DashboardScope,
  asked: DashboardFilters,
  period: RunningPeriod,
  today: string,
): Promise<DashboardView> {
  const [held, programs, { limits }, basis] = await Promise.all([
    readHeldChoices(db, scope.visible),
    scope.picksProgram ? listStudyPrograms(db) : null,
    readFitnessLimits(db),
    readBasis(db, today),
  ]);
  const filters = knownFilters(asked, {
    stages: period !== null,
    programIds: new Set(programs?.map((program) => program.id)),
    provinces: new Set(held.provinces),
    agencies: new Set([NO_AGENCY, ...held.agencies]),
  });
  const stages = stageCohorts(held.cohortYears, period);
  const counted = dashboardStudents(scope.visible, filters, stages);
  const filtered = filtersInUse(filters) > 0;
  const everyone = filtered
    ? dashboardStudents(scope.visible, NO_FILTERS, stages)
    : null;
  const [counts, achievement, grades, physical, mental, mentoring] =
    await Promise.all([
      countChoices(db, scope.visible, filters, stages),
      readAchievement(db, counted, filtered),
      readCharacterGrades(db, counted, basis, filtered),
      readPhysical(db, limits, counted, scope.illnesses),
      readMental(db, counted, scope.shared),
      readMentoring(db, {
        where: counted,
        everyone,
        notes: scope.notes,
        byProgram: scope.picksProgram,
        detail: scope.detail,
        today,
      }),
    ]);
  return {
    filters,
    programs,
    stagesShown: period !== null,
    period,
    held,
    counts,
    achievement,
    grades,
    physical,
    mental,
    mentoring,
    fitnessLimits: limits,
  };
}
