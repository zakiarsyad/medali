import { and, asc, count, eq, type SQL } from "drizzle-orm";
import type { Scores } from "@/character-scores/assessment-score";
import { listedForCoaching } from "@/character-scores/coaching-listed";
import {
  type CoachingNeed,
  coachingNeedOf,
} from "@/character-scores/coaching-need";
import { latestAssessments } from "@/character-scores/latest-assessments";
import type { Database } from "@/db/connect";
import { students, studyPrograms } from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import { pageWithin } from "@/ui/list-pages";
import {
  type AssessmentParams,
  COACHING_FIRST_ROWS,
  COACHING_PAGE_SIZE,
} from "./assessment-address";

/** One student of "Teridentifikasi perlu pembinaan". */
export interface CoachingRow {
  id: string;
  name: string;
  nim: string;
  program: string;
  /** The scores of their latest assessment. */
  scores: Scores;
  need: CoachingNeed;
}

export interface CoachingList {
  rows: CoachingRow[];
  /** How many students are listed, on every page. */
  matching: number;
  /** The page shown of the full list; 1 while only the first rows show. */
  page: number;
  showsAll: boolean;
}

type ListParams = Pick<AssessmentParams, "coachingAll" | "coachingPage">;

function needOf(scores: Scores): CoachingNeed {
  const need = coachingNeedOf(scores);
  if (need === null) {
    throw new Error("The database listed a student the rule does not list.");
  }
  return need;
}

/**
 * "Teridentifikasi perlu pembinaan": the Aktif students `visible` lets
 * through whose latest assessment lists them, the first 10, or with
 * "Tampilkan semua" 25 a page. Intensif, Sedang, then Ringan, the lowest
 * Rerata first within each: as the levels follow the Rerata, that is the
 * lowest total first, then by name.
 */
export async function readCoachingList(
  db: Database,
  visible: SQL,
  params: ListParams,
): Promise<CoachingList> {
  const latest = latestAssessments(db);
  const where = and(visible, ACTIVE_MEMBER, listedForCoaching(latest));
  const [counted] = await db
    .select({ matching: count() })
    .from(students)
    .innerJoin(latest, eq(latest.studentId, students.id))
    .where(where);
  const matching = counted?.matching ?? 0;
  const size = params.coachingAll ? COACHING_PAGE_SIZE : COACHING_FIRST_ROWS;
  const page = params.coachingAll
    ? pageWithin(params.coachingPage, matching, COACHING_PAGE_SIZE)
    : 1;
  const shown = await db
    .select({
      id: students.id,
      name: students.name,
      nim: students.nim,
      program: studyPrograms.name,
      M: latest.scoreM,
      E: latest.scoreE,
      D: latest.scoreD,
      A: latest.scoreA,
      L: latest.scoreL,
      I: latest.scoreI,
    })
    .from(students)
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .innerJoin(latest, eq(latest.studentId, students.id))
    .where(where)
    .orderBy(asc(latest.total), asc(students.name), asc(students.nim))
    .limit(size)
    .offset((page - 1) * size);
  const rows = shown.map(({ id, name, nim, program, ...scores }) => ({
    id,
    name,
    nim,
    program,
    scores,
    need: needOf(scores),
  }));
  return { rows, matching, page, showsAll: params.coachingAll };
}
