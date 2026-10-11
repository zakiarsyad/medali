import { count, eq } from "drizzle-orm";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import type { CategoryField } from "./labels";
import { countWhere } from "./student-conditions";
import { found } from "./student-list";
import type { EntryPath, StudentListFilters } from "./student-list-address";

/** How many students each choice of the top bar holds. */
export interface ChoiceCounts {
  /** By the id of the program studi. One without students is left out. */
  programs: Map<number, number>;
  entryPaths: Record<EntryPath, number>;
  categories: Record<CategoryField, number>;
}

async function countPrograms(
  db: Database,
  limit: RowLimit,
  filters: StudentListFilters,
): Promise<ChoiceCounts["programs"]> {
  const rows = await db
    .select({ id: students.studyProgramId, held: count() })
    .from(students)
    .where(found(limit, { ...filters, studyProgramId: null }))
    .groupBy(students.studyProgramId);
  return new Map(rows.map((row) => [row.id, row.held]));
}

async function countEntryPaths(
  db: Database,
  limit: RowLimit,
  filters: StudentListFilters,
): Promise<ChoiceCounts["entryPaths"]> {
  const [counted] = await db
    .select({
      regular: countWhere(eq(students.entryPath, "regular")),
      transfer: countWhere(eq(students.entryPath, "transfer")),
    })
    .from(students)
    .where(found(limit, { ...filters, entryPath: null }));
  if (!counted) throw new Error("The jalur were not counted.");
  return counted;
}

async function countCategories(
  db: Database,
  limit: RowLimit,
  filters: StudentListFilters,
): Promise<ChoiceCounts["categories"]> {
  const [counted] = await db
    .select({
      isAffirmation: countWhere(eq(students.isAffirmation, true)),
      isSeedling: countWhere(eq(students.isSeedling, true)),
      isInternational: countWhere(eq(students.isInternational, true)),
      isBlended: countWhere(eq(students.isBlended, true)),
    })
    .from(students)
    .where(found(limit, { ...filters, category: null }));
  if (!counted) throw new Error("The kategori were not counted.");
  return counted;
}

/**
 * How many students an account may see under each choice of Program
 * studi, Jalur and Kategori. A choice is counted with every other filter
 * applied and without its own, so it says what choosing it would find.
 */
export async function countChoices(
  db: Database,
  limit: RowLimit,
  filters: StudentListFilters,
): Promise<ChoiceCounts> {
  const [programs, entryPaths, categories] = await Promise.all([
    countPrograms(db, limit, filters),
    countEntryPaths(db, limit, filters),
    countCategories(db, limit, filters),
  ]);
  return { programs, entryPaths, categories };
}
