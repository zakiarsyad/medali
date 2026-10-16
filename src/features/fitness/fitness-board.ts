import {
  and,
  asc,
  between,
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
  FITNESS_LIST_PAGE_SIZE,
  type FitnessFilter,
  type FitnessParams,
} from "./fitness-address";
import { categoryRange } from "./fitness-category";
import { countFitness, type FitnessNumbers } from "./fitness-counts";
import type { FitnessLimits } from "./fitness-ids";
import { yearStartOf } from "./fitness-input";
import { latestFitnessScores } from "./latest-fitness-scores";

/** One student of "Hasil tes kebugaran". */
export interface FitnessListRow {
  id: string;
  name: string;
  nim: string;
  program: string;
  /** The latest score and the day of its test, or null for Belum dites. */
  latest: { score: number; testedOn: string } | null;
}

export interface FitnessList {
  rows: FitnessListRow[];
  /** How many students the filters let through, on every page. */
  matching: number;
  /** The page shown, the last one when the address asked for more. */
  page: number;
}

type Latest = ReturnType<typeof latestFitnessScores>;

/** The Aktif students among those `visible` lets through. */
function seen(visible: SQL): SQL | undefined {
  return and(visible, ACTIVE_MEMBER);
}

/**
 * The numbers of the tab and of the panel "Kategori", of the Aktif
 * students the account sees. The students are grouped by their latest
 * score and the day of its test, so only a few
 * rows leave the database, and the categories are worked out here by
 * the one rule with the limits in force.
 */
export async function readFitnessNumbers(
  db: Database,
  visible: SQL,
  limits: FitnessLimits,
  today: string,
): Promise<FitnessNumbers> {
  const latest = latestFitnessScores(db);
  const groups = await db
    .select({
      score: latest.score,
      testedOn: latest.testedOn,
      students: count(),
    })
    .from(students)
    .leftJoin(latest, eq(latest.studentId, students.id))
    .where(seen(visible))
    .groupBy(latest.score, latest.testedOn);
  const yearStart = yearStartOf(today);
  return countFitness(
    groups.map(({ score, testedOn, students }) => ({
      students,
      latest:
        score === null || testedOn === null
          ? null
          : { score, thisYear: testedOn >= yearStart },
    })),
    limits,
  );
}

function filterOf(
  latest: Latest,
  filter: FitnessFilter,
  limits: FitnessLimits,
): SQL | undefined {
  if (filter === "all") return undefined;
  if (filter === "untested") return isNull(latest.studentId);
  const range = categoryRange(filter, limits);
  return between(latest.score, range.lowest, range.highest);
}

function matching(query: string): SQL | undefined {
  if (query === "") return undefined;
  const pattern = containsPattern(query);
  return or(ilike(students.name, pattern), ilike(students.nim, pattern));
}

/**
 * One page of "Hasil tes kebugaran": the Aktif students the account sees
 * who match the search and the filter, each with their latest score.
 * The lower the score the more serious its category, so the lowest
 * score comes first, then the name; Belum dites comes last.
 */
export async function readFitnessList(
  db: Database,
  visible: SQL,
  limits: FitnessLimits,
  params: FitnessParams,
): Promise<FitnessList> {
  const latest = latestFitnessScores(db);
  const where = and(
    seen(visible),
    matching(params.query),
    filterOf(latest, params.filter, limits),
  );
  const [counted] = await db
    .select({ matching: count() })
    .from(students)
    .leftJoin(latest, eq(latest.studentId, students.id))
    .where(where);
  const total = counted?.matching ?? 0;
  const page = pageWithin(params.page, total, FITNESS_LIST_PAGE_SIZE);
  const rows = await db
    .select({
      id: students.id,
      name: students.name,
      nim: students.nim,
      program: studyPrograms.name,
      score: latest.score,
      testedOn: latest.testedOn,
    })
    .from(students)
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .leftJoin(latest, eq(latest.studentId, students.id))
    .where(where)
    .orderBy(
      sql`${latest.score} asc nulls last`,
      asc(students.name),
      asc(students.nim),
    )
    .limit(FITNESS_LIST_PAGE_SIZE)
    .offset((page - 1) * FITNESS_LIST_PAGE_SIZE);
  return {
    rows: rows.map(({ score, testedOn, ...student }) => ({
      ...student,
      latest: score === null || testedOn === null ? null : { score, testedOn },
    })),
    matching: total,
    page,
  };
}
