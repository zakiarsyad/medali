import { and, asc, count, isNotNull, type SQL, sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { heldByStage } from "@/academic-periods/stage-cohorts";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import type { DormId } from "@/dorms/dorms";
import { dormInSql } from "@/dorms/resident-condition";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import { type DashboardFilters, NO_AGENCY } from "./dashboard-address";
import { type DashboardCohorts, dashboardStudents } from "./dashboard-students";
import { type DormChoice, heldByDormChoice } from "./dorm-choices";

/** What the Aktif students an account sees hold, before any filter. */
export interface HeldChoices {
  cohortYears: number[];
  /** In alphabetical order. */
  provinces: string[];
  /** In alphabetical order, without `NO_AGENCY`. */
  agencies: string[];
}

/**
 * A column as a value of one type. A column that may be empty is read
 * only where it is not, so its value is never null.
 */
function columnAs<T>(column: PgColumn): SQL<T> {
  return sql<T>`${column}`;
}

async function distinctOf<T>(
  db: Database,
  column: PgColumn,
  where: SQL | undefined,
): Promise<T[]> {
  const rows = await db
    .selectDistinct({ value: columnAs<T>(column) })
    .from(students)
    .where(and(where, isNotNull(column)))
    .orderBy(asc(column));
  return rows.map((row) => row.value);
}

/**
 * The angkatan, provinsi and instansi the Aktif students an account sees
 * hold: the choices it may make in the filter.
 */
export async function readHeldChoices(
  db: Database,
  visible: SQL,
): Promise<HeldChoices> {
  const seen = and(visible, ACTIVE_MEMBER);
  const [cohortYears, provinces, agencies] = await Promise.all([
    distinctOf<number>(db, students.cohortYear, seen),
    distinctOf<string>(db, students.province, seen),
    distinctOf<string>(db, students.originAgency, seen),
  ]);
  return { cohortYears, provinces, agencies };
}

/** How many students each choice of the filter would give. */
export interface ChoiceCounts {
  /** How many students match every filter. */
  matching: number;
  /** By the number of the tahap. */
  stages: Map<number, number>;
  programs: Map<number, number>;
  entryPaths: Map<string, number>;
  /** By the name of the provinsi; students without one are under null. */
  provinces: Map<string | null, number>;
  affirmation: Map<boolean, number>;
  seedling: Map<boolean, number>;
  international: Map<boolean, number>;
  /** By the name of the instansi, and by `NO_AGENCY`. */
  agencies: Map<string, number>;
  /** By the Asrama choice. */
  dorms: Map<DormChoice, number>;
}

async function countEach<T>(
  db: Database,
  column: PgColumn,
  where: SQL,
): Promise<Map<T, number>> {
  const rows = await db
    .select({ value: columnAs<T>(column), held: count() })
    .from(students)
    .where(where)
    .groupBy(column);
  return new Map(rows.map((row) => [row.value, row.held]));
}

async function countMatching(db: Database, where: SQL): Promise<number> {
  const [counted] = await db
    .select({ held: count() })
    .from(students)
    .where(where);
  return counted?.held ?? 0;
}

async function countAgencies(
  db: Database,
  where: SQL,
): Promise<Map<string, number>> {
  const byName = await countEach<string | null>(
    db,
    students.originAgency,
    where,
  );
  const held = new Map<string, number>();
  for (const [name, amount] of byName) held.set(name ?? NO_AGENCY, amount);
  return held;
}

/**
 * How many of the students counted live in each dorm, and in none under
 * null. The dorm of each student is worked out once, in a read of its own.
 */
async function countDorms(
  db: Database,
  where: SQL,
  dormCohorts: number[],
): Promise<Map<DormChoice, number>> {
  const lived = db
    .select({ dorm: dormInSql(dormCohorts).as("dorm") })
    .from(students)
    .where(where)
    .as("lived");
  const rows = await db
    .select({ dorm: lived.dorm, held: count() })
    .from(lived)
    .groupBy(lived.dorm);
  return heldByDormChoice(
    new Map<DormId | null, number>(rows.map((row) => [row.dorm, row.held])),
  );
}

/**
 * How many Aktif students the account sees under each choice of the
 * filter. A choice is counted with every other filter applied and without
 * its own, so it says what choosing it would give. The database counts
 * them, one small count for each list of choices.
 */
export async function countChoices(
  db: Database,
  visible: SQL,
  filters: DashboardFilters,
  cohorts: DashboardCohorts,
): Promise<ChoiceCounts> {
  const without = (left: Partial<DashboardFilters>) =>
    dashboardStudents(visible, { ...filters, ...left }, cohorts);
  const [
    matching,
    byCohort,
    programs,
    entryPaths,
    provinces,
    affirmation,
    seedling,
    international,
    agencies,
    dorms,
  ] = await Promise.all([
    countMatching(db, without({})),
    countEach<number>(db, students.cohortYear, without({ stageNo: null })),
    countEach<number>(
      db,
      students.studyProgramId,
      without({ studyProgramId: null }),
    ),
    countEach<string>(db, students.entryPath, without({ entryPath: null })),
    countEach<string | null>(
      db,
      students.province,
      without({ province: null }),
    ),
    countEach<boolean>(
      db,
      students.isAffirmation,
      without({ affirmation: null }),
    ),
    countEach<boolean>(db, students.isSeedling, without({ seedling: null })),
    countEach<boolean>(
      db,
      students.isInternational,
      without({ international: null }),
    ),
    countAgencies(db, without({ originAgency: null })),
    countDorms(db, without({ dorm: null }), cohorts.dorms),
  ]);
  return {
    matching,
    stages: heldByStage(byCohort, cohorts.stages),
    programs,
    entryPaths,
    provinces,
    affirmation,
    seedling,
    international,
    agencies,
    dorms,
  };
}
