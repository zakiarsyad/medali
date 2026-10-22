import { and, asc, eq, not, type SQL } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { fixedCharacterGrades } from "@/db/schema";
import {
  GRADE_LIST_PAGE_SIZE,
  type GradeParams,
} from "@/features/character-grades/grade-address";
import { pageWithin } from "@/ui/list-pages";
import { fixedFacts, fixedRowOf } from "./fixed-grade-rows";
import type { GradeList } from "./grade-list";
import { type GradeNumbers, gradeNumbersFrom } from "./grade-numbers";
import { countMatching, listWhere } from "./grade-page";
import { totalsOf } from "./read-grade-numbers";

/** One page of the fixed grades, with the students whose name opens nothing. */
export interface FixedGradeList extends GradeList {
  nameOnly: string[];
}

/**
 * One page of "Daftar nilai karakter" of a closed semester: the fixed
 * grades `visible` lets through that match the search and the filter,
 * by name. The database finds, counts and pages them, and only the rows
 * of the page leave it. `opens` tells which names open their student.
 */
export async function readFixedGradePage(
  db: Database,
  visible: SQL,
  opens: SQL,
  closingId: string,
  params: GradeParams,
): Promise<FixedGradeList> {
  const facts = fixedFacts(db, visible, closingId, opens);
  const where = listWhere(facts, params);
  const total = await countMatching(db, facts, where);
  const page = pageWithin(params.page, total, GRADE_LIST_PAGE_SIZE);
  const shown = await db
    .select()
    .from(facts)
    .where(where)
    .orderBy(asc(facts.name), asc(facts.nim))
    .limit(GRADE_LIST_PAGE_SIZE)
    .offset((page - 1) * GRADE_LIST_PAGE_SIZE);
  return {
    rows: shown.map(fixedRowOf),
    matching: total,
    page,
    nameOnly: shown.filter((row) => !row.opens).map((row) => row.studentId),
  };
}

/**
 * The numbers above "Skema bobot" of a closed semester, from the fixed
 * grades `visible` lets through, counted as the live numbers are.
 */
export async function readFixedGradeNumbers(
  db: Database,
  visible: SQL,
  closingId: string,
): Promise<GradeNumbers> {
  const facts = fixedFacts(db, visible, closingId);
  const [totals] = await db
    .select(
      totalsOf({
        name: facts.name,
        nim: facts.nim,
        final: facts.final,
        passes: facts.passes,
        adjusted: facts.sikuAdjusted,
        limited: facts.limited,
      }),
    )
    .from(facts);
  if (!totals) throw new Error("Counting the fixed grades gave no row.");
  return gradeNumbersFrom(totals);
}

/**
 * Nilai dasar SIKU when the closing was made: the SIKU of a student no
 * entry gained or lost points, as the closing keeps no other copy of it.
 * Null when every student had an entry, or the closing kept nobody.
 */
export async function readFixedSikuBase(
  db: Database,
  closingId: string,
): Promise<number | null> {
  const grades = fixedCharacterGrades;
  const [base] = await db
    .select({ siku: grades.siku })
    .from(grades)
    .where(and(eq(grades.closingId, closingId), not(grades.sikuAdjusted)))
    .limit(1);
  return base?.siku ?? null;
}
