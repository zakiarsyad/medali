import {
  and,
  asc,
  count,
  eq,
  ilike,
  isNull,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import type { Database } from "@/db/connect";
import { containsPattern } from "@/db/contains-pattern";
import { students, studyPrograms } from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import { pageWithin } from "@/ui/list-pages";
import {
  ASSESSMENT_LIST_PAGE_SIZE,
  type AssessmentFilter,
  type AssessmentParams,
} from "./assessment-address";
import { type AssessmentNumbers, countAssessed } from "./assessment-counts";
import {
  type LatestAssessment,
  latestAssessments,
  readLatestOf,
} from "./latest-assessments";

/** One student of "Hasil asesmen karakter". */
export interface AssessmentListRow {
  id: string;
  name: string;
  nim: string;
  program: string;
  /** Null for a student who is Belum diasesmen. */
  latest: LatestAssessment | null;
}

export interface AssessmentList {
  rows: AssessmentListRow[];
  /** How many students the filters let through, on every page. */
  matching: number;
  /** The page shown, the last one when the address asked for more. */
  page: number;
}

/** The Aktif students among those `visible` lets through. */
function seen(visible: SQL): SQL | undefined {
  return and(visible, ACTIVE_MEMBER);
}

/**
 * The four numbers, of the Aktif students the account sees. The students
 * are grouped by the total of their latest scores and the period it was
 * made in, so only a few rows leave the database, and the numbers are
 * worked out here by the one rule. `runningPeriodId` is null while no
 * period runs: nobody is then assessed this semester.
 */
export async function readAssessmentNumbers(
  db: Database,
  visible: SQL,
  runningPeriodId: string | null,
): Promise<AssessmentNumbers> {
  const latest = latestAssessments(db);
  const groups = await db
    .select({
      total: latest.total,
      periodId: latest.periodId,
      students: count(),
    })
    .from(students)
    .leftJoin(latest, eq(latest.studentId, students.id))
    .where(seen(visible))
    .groupBy(latest.total, latest.periodId);
  return countAssessed(
    groups.map(({ students, total, periodId }) => ({
      students,
      latest:
        total === null
          ? null
          : { total, inRunningPeriod: periodId === runningPeriodId },
    })),
  );
}

function filterOf(
  latest: ReturnType<typeof latestAssessments>,
  filter: AssessmentFilter,
): SQL | undefined {
  switch (filter) {
    case "all":
      return undefined;
    case "none":
      return isNull(latest.studentId);
  }
}

function matching(query: string): SQL | undefined {
  if (query === "") return undefined;
  const pattern = containsPattern(query);
  return or(ilike(students.name, pattern), ilike(students.nim, pattern));
}

/**
 * One page of "Hasil asesmen karakter": the Aktif students the account
 * sees who match the search and the filter, each with their latest
 * assessment, the newest first and those without one last, then by name.
 */
export async function readAssessmentList(
  db: Database,
  visible: SQL,
  params: AssessmentParams,
): Promise<AssessmentList> {
  const latest = latestAssessments(db);
  const where = and(
    seen(visible),
    matching(params.query),
    filterOf(latest, params.filter),
  );
  const [counted] = await db
    .select({ matching: count() })
    .from(students)
    .leftJoin(latest, eq(latest.studentId, students.id))
    .where(where);
  const total = counted?.matching ?? 0;
  const page = pageWithin(params.page, total, ASSESSMENT_LIST_PAGE_SIZE);
  const shown = await db
    .select({
      id: students.id,
      name: students.name,
      nim: students.nim,
      program: studyPrograms.name,
    })
    .from(students)
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .leftJoin(latest, eq(latest.studentId, students.id))
    .where(where)
    .orderBy(
      sql`${latest.enteredAt} desc nulls last`,
      asc(students.name),
      asc(students.nim),
    )
    .limit(ASSESSMENT_LIST_PAGE_SIZE)
    .offset((page - 1) * ASSESSMENT_LIST_PAGE_SIZE);
  const found = await readLatestOf(
    db,
    shown.map((student) => student.id),
  );
  const rows = shown.map((student) => ({
    ...student,
    latest: found.get(student.id) ?? null,
  }));
  return { rows, matching: total, page };
}
