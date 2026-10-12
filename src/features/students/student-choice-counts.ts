import { count, eq } from "drizzle-orm";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import type { CategoryField } from "./labels";
import type { StageCohorts } from "./stage-cohorts";
import {
  countAgencies,
  countProvinces,
  countStages,
} from "./stage-origin-counts";
import { countWhere } from "./student-conditions";
import { found } from "./student-list";
import type { EntryPath, StudentListFilters } from "./student-list-address";

/** How many students each choice of the top bar holds. */
export interface ChoiceCounts {
  /** By the id of the program studi. One without students is left out. */
  programs: Map<number, number>;
  entryPaths: Record<EntryPath, number>;
  categories: Record<CategoryField, number>;
  /** By the number of the tahap. */
  stages: Map<number, number>;
  /** By the name of the provinsi. */
  provinces: Map<string, number>;
  /** By the name of the instansi, and by `NO_AGENCY`. */
  agencies: Map<string, number>;
}

async function countPrograms(
  db: Database,
  limit: RowLimit,
  filters: StudentListFilters,
  cohorts: StageCohorts,
): Promise<ChoiceCounts["programs"]> {
  const rows = await db
    .select({ id: students.studyProgramId, held: count() })
    .from(students)
    .where(found(limit, { ...filters, studyProgramId: null }, cohorts))
    .groupBy(students.studyProgramId);
  return new Map(rows.map((row) => [row.id, row.held]));
}

async function countEntryPaths(
  db: Database,
  limit: RowLimit,
  filters: StudentListFilters,
  cohorts: StageCohorts,
): Promise<ChoiceCounts["entryPaths"]> {
  const [counted] = await db
    .select({
      regular: countWhere(eq(students.entryPath, "regular")),
      transfer: countWhere(eq(students.entryPath, "transfer")),
    })
    .from(students)
    .where(found(limit, { ...filters, entryPath: null }, cohorts));
  if (!counted) throw new Error("The jalur were not counted.");
  return counted;
}

async function countCategories(
  db: Database,
  limit: RowLimit,
  filters: StudentListFilters,
  cohorts: StageCohorts,
): Promise<ChoiceCounts["categories"]> {
  const [counted] = await db
    .select({
      isAffirmation: countWhere(eq(students.isAffirmation, true)),
      isSeedling: countWhere(eq(students.isSeedling, true)),
      isInternational: countWhere(eq(students.isInternational, true)),
      isBlended: countWhere(eq(students.isBlended, true)),
    })
    .from(students)
    .where(found(limit, { ...filters, category: null }, cohorts));
  if (!counted) throw new Error("The kategori were not counted.");
  return counted;
}

/**
 * How many students an account may see under each choice of the top bar.
 * A choice is counted with every other filter applied and without its
 * own, so it says what choosing it would find.
 */
export async function countChoices(
  db: Database,
  limit: RowLimit,
  filters: StudentListFilters,
  cohorts: StageCohorts,
): Promise<ChoiceCounts> {
  const [programs, entryPaths, categories, stages, provinces, agencies] =
    await Promise.all([
      countPrograms(db, limit, filters, cohorts),
      countEntryPaths(db, limit, filters, cohorts),
      countCategories(db, limit, filters, cohorts),
      countStages(db, limit, filters, cohorts),
      countProvinces(db, limit, filters, cohorts),
      countAgencies(db, limit, filters, cohorts),
    ]);
  return { programs, entryPaths, categories, stages, provinces, agencies };
}
