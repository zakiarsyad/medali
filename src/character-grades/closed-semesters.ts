import { desc, eq } from "drizzle-orm";
import type { AcademicPeriod } from "@/academic-periods/academic-period";
import type { Database } from "@/db/connect";
import { academicPeriods, semesterClosings } from "@/db/schema";
import { schemeOf } from "./grade-scheme";
import type { GradeScheme } from "./scheme-ids";

/** When a semester was closed, and how many grades its closing fixed. */
export interface ClosedSemester {
  closedAt: Date;
  kept: number;
}

/** Every closed semester, by the key of its period. */
export async function readClosedSemesters(
  db: Database,
): Promise<Map<string, ClosedSemester>> {
  const rows = await db
    .select({
      periodId: semesterClosings.periodId,
      closedAt: semesterClosings.closedAt,
      kept: semesterClosings.students,
    })
    .from(semesterClosings);
  return new Map(rows.map(({ periodId, ...closed }) => [periodId, closed]));
}

/** A closed period, as the choice "Semester" offers it, with the scheme its closing kept. */
export interface ClosedPeriod {
  closingId: string;
  period: Pick<AcademicPeriod, "id" | "startYear" | "term">;
  closedAt: Date;
  scheme: GradeScheme;
}

/** Every closed period, newest first. */
export async function readClosedPeriods(db: Database): Promise<ClosedPeriod[]> {
  const rows = await db
    .select({
      closing: semesterClosings,
      id: academicPeriods.id,
      startYear: academicPeriods.startYear,
      term: academicPeriods.term,
    })
    .from(semesterClosings)
    .innerJoin(
      academicPeriods,
      eq(academicPeriods.id, semesterClosings.periodId),
    )
    .orderBy(desc(academicPeriods.startsOn));
  return rows.map(({ closing, ...period }) => ({
    closingId: closing.id,
    period,
    closedAt: closing.closedAt,
    scheme: schemeOf(closing),
  }));
}

/**
 * The closed period an address asks for, or null for the running
 * semester: also when it names a period that is not closed, or none.
 */
export function chosenClosed<Closed extends { period: { id: string } }>(
  closed: readonly Closed[],
  asked: string | null,
): Closed | null {
  if (asked === null) return null;
  return closed.find((each) => each.period.id === asked) ?? null;
}
