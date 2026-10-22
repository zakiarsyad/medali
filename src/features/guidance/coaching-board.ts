import { and, asc, count, eq, ilike, ne, or, type SQL, sql } from "drizzle-orm";
import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import { studentSemester } from "@/academic-periods/student-semester";
import type { AccountForAccess } from "@/auth/access";
import { rerataOf, type Scores } from "@/character-scores/assessment-score";
import {
  coachingLevelSql,
  listedForCoaching,
} from "@/character-scores/coaching-listed";
import {
  type CoachingLevel,
  coachingNeedOf,
} from "@/character-scores/coaching-need";
import {
  type CoachingStatus,
  FIRST_COACHING_STATUS,
} from "@/character-scores/coaching-status";
import { latestAssessments } from "@/character-scores/latest-assessments";
import type { Database } from "@/db/connect";
import { containsPattern } from "@/db/contains-pattern";
import { coachingStatuses, students, studyPrograms } from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import { MENTOR_NAME } from "@/mentoring/mentor-name";
import { pageWithin } from "@/ui/list-pages";
import type { ValueKey } from "@/ui/medali-values";
import { COACHING_PAGE_SIZE, type CoachingParams } from "./coaching-address";
import {
  coachingChangeReachOf,
  coachingLimitOf,
  coachingReachOf,
} from "./coaching-reach";
import { isMenteesOnly } from "./penalty-board";

/** The four numbers of the tab, of the students the account sees. */
export interface CoachingNumbers {
  /** Belum selesai: listed students not yet Selesai. */
  open: number;
  /** How many are listed in all: "dari (n) teridentifikasi". */
  identified: number;
  /** Intensif, Sedang and Ringan, among those not yet Selesai. */
  intensive: number;
  moderate: number;
  light: number;
}

/** One student of the list, with all its row shows. */
export interface CoachingRow {
  studentId: string;
  name: string;
  nim: string;
  program: string;
  /** The student's semester in the running period; null while none runs. */
  semester: number | null;
  /** Today's mentor of the student's group, or null for none. */
  mentorName: string | null;
  level: CoachingLevel;
  /** "Aspek terlemah" and its score. */
  weakest: ValueKey;
  weakestScore: number;
  rerata: number;
  /** Teridentifikasi for a student with no saved status. */
  status: CoachingStatus;
  /** Catatan; empty when none was written. */
  note: string;
  /** The version of the saved status, 0 while none is saved. */
  version: number;
  /** Whether the account may change this student's status. */
  mayChange: boolean;
}

export interface CoachingList {
  rows: CoachingRow[];
  /** How many students match in all. */
  matching: number;
  /** The page shown, the last one when a later one was asked for. */
  page: number;
}

export interface CoachingBoard {
  numbers: CoachingNumbers;
  list: CoachingList;
  /** Whether the account sees only its own mentees: "Menampilkan mahasiswa binaan Anda." */
  menteesOnly: boolean;
}

type Latest = ReturnType<typeof latestAssessments>;

const NO_NUMBERS: CoachingNumbers = {
  open: 0,
  identified: 0,
  intensive: 0,
  moderate: 0,
  light: 0,
};

/** The status a student shows: the one saved, or Teridentifikasi. */
export const SHOWN_STATUS = sql<CoachingStatus>`coalesce(${coachingStatuses.status}, ${sql.raw(`'${FIRST_COACHING_STATUS}'`)})`;

const NOT_DONE = ne(SHOWN_STATUS, "done");

/** The Aktif students within `reach` whose latest assessment lists them. */
export function listedWithin(reach: SQL, latest: Latest): SQL {
  return and(reach, ACTIVE_MEMBER, listedForCoaching(latest)) ?? reach;
}

function nameOrNim(query: string): SQL | undefined {
  if (query === "") return undefined;
  const pattern = containsPattern(query);
  return or(ilike(students.name, pattern), ilike(students.nim, pattern));
}

function levelIs(latest: Latest, level: CoachingParams["level"]) {
  if (level === "all") return undefined;
  return sql`${coachingLevelSql(latest)} = ${level}`;
}

function statusIs(status: CoachingParams["status"]): SQL | undefined {
  if (status === "all") return undefined;
  if (status === "open") return NOT_DONE;
  return eq(SHOWN_STATUS, status);
}

function countOf(condition: SQL | undefined) {
  return sql<number>`count(*) filter (where ${condition})`.mapWith(Number);
}

function openOfLevel(latest: Latest, level: CoachingLevel) {
  return countOf(and(NOT_DONE, levelIs(latest, level)));
}

/** The four numbers of the students the account sees. */
async function readNumbers(
  db: Database,
  reach: SQL,
  latest: Latest,
): Promise<CoachingNumbers> {
  const [found] = await db
    .select({
      open: countOf(NOT_DONE),
      identified: count(),
      intensive: openOfLevel(latest, "intensive"),
      moderate: openOfLevel(latest, "moderate"),
      light: openOfLevel(latest, "light"),
    })
    .from(students)
    .innerJoin(latest, eq(latest.studentId, students.id))
    .leftJoin(coachingStatuses, eq(coachingStatuses.studentId, students.id))
    .where(listedWithin(reach, latest));
  return found ?? NO_NUMBERS;
}

export function needOf(scores: Scores) {
  const need = coachingNeedOf(scores);
  if (need === null) {
    throw new Error("The database listed a student the rule does not list.");
  }
  return need;
}

function semesterOf(cohortYear: number, period: AcademicPeriod | null) {
  return period === null ? null : studentSemester(cohortYear, period);
}

async function readList(
  db: Database,
  actor: AccountForAccess,
  reach: SQL,
  latest: Latest,
  params: CoachingParams,
  period: AcademicPeriod | null,
): Promise<CoachingList> {
  const where = and(
    listedWithin(reach, latest),
    levelIs(latest, params.level),
    statusIs(params.status),
    nameOrNim(params.query),
  );
  const [counted] = await db
    .select({ matching: count() })
    .from(students)
    .innerJoin(latest, eq(latest.studentId, students.id))
    .leftJoin(coachingStatuses, eq(coachingStatuses.studentId, students.id))
    .where(where);
  const matching = counted?.matching ?? 0;
  const page = pageWithin(params.page, matching, COACHING_PAGE_SIZE);
  const changeReach = coachingChangeReachOf(actor);
  const found = await db
    .select({
      studentId: students.id,
      name: students.name,
      nim: students.nim,
      program: studyPrograms.name,
      cohortYear: students.cohortYear,
      mentorName: MENTOR_NAME,
      M: latest.scoreM,
      E: latest.scoreE,
      D: latest.scoreD,
      A: latest.scoreA,
      L: latest.scoreL,
      I: latest.scoreI,
      status: SHOWN_STATUS,
      note: sql<string>`coalesce(${coachingStatuses.note}, '')`,
      version: sql<number>`coalesce(${coachingStatuses.version}, 0)`.mapWith(
        Number,
      ),
      mayChange: (changeReach === null
        ? sql<boolean>`false`
        : sql<boolean>`(${changeReach})`
      ).mapWith(Boolean),
    })
    .from(students)
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .innerJoin(latest, eq(latest.studentId, students.id))
    .leftJoin(coachingStatuses, eq(coachingStatuses.studentId, students.id))
    .where(where)
    .orderBy(asc(latest.total), asc(students.name), asc(students.nim))
    .limit(COACHING_PAGE_SIZE)
    .offset((page - 1) * COACHING_PAGE_SIZE);
  const rows = found.map(({ M, E, D, A, L, I, cohortYear, ...row }) => {
    const scores = { M, E, D, A, L, I };
    const need = needOf(scores);
    return {
      studentId: row.studentId,
      name: row.name,
      nim: row.nim,
      program: row.program,
      semester: semesterOf(cohortYear, period),
      mentorName: row.mentorName,
      level: need.level,
      weakest: need.weakest,
      weakestScore: scores[need.weakest],
      rerata: rerataOf(scores),
      status: row.status,
      note: row.note,
      version: row.version,
      mayChange: row.mayChange,
    };
  });
  return { rows, matching, page };
}

/**
 * Pembinaan karakter for an account whose roles open the tab: the
 * numbers and one page of the Aktif students whose latest assessment
 * lists them, of the rows of those roles, that match the search and the
 * filters. Intensif first, then the lowest Rerata: as the levels follow
 * the Rerata, that is the lowest total first, then by name. Each row
 * says whether the account may change it, by its roles with that right
 * alone. `today` picks the running period, for the semester. Null, with
 * nothing read, for any other account.
 */
export async function readCoachingBoard(
  db: Database,
  actor: AccountForAccess,
  params: CoachingParams,
  today: string,
): Promise<CoachingBoard | null> {
  const limit = coachingLimitOf(actor);
  const reach = coachingReachOf(actor);
  if (limit === null || reach === null) return null;
  const latest = latestAssessments(db);
  const period = await readRunningPeriod(db, today);
  const [numbers, list] = await Promise.all([
    readNumbers(db, reach, latest),
    readList(db, actor, reach, latest, params, period),
  ]);
  return { numbers, list, menteesOnly: isMenteesOnly(limit) };
}

/**
 * Belum selesai as the tab counts it for the account, for the number
 * beside the menu item. Zero for an account whose roles do not open the
 * tab.
 */
export async function readOpenCoachingCount(
  db: Database,
  actor: AccountForAccess,
): Promise<number> {
  const reach = coachingReachOf(actor);
  if (reach === null) return 0;
  const latest = latestAssessments(db);
  const [found] = await db
    .select({ open: count() })
    .from(students)
    .innerJoin(latest, eq(latest.studentId, students.id))
    .leftJoin(coachingStatuses, eq(coachingStatuses.studentId, students.id))
    .where(and(listedWithin(reach, latest), NOT_DONE));
  return found?.open ?? 0;
}
