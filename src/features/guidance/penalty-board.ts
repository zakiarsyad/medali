import {
  and,
  count,
  desc,
  eq,
  ilike,
  isNotNull,
  ne,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import {
  type AccountForAccess,
  may,
  type RowLimit,
  rowLimitForAction,
} from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { containsPattern } from "@/db/contains-pattern";
import {
  accounts,
  disciplinePenalties,
  students,
  studyPrograms,
} from "@/db/schema";
import type {
  PenaltyCategory,
  PenaltyLevel,
} from "@/discipline-penalties/penalty-kinds";
import { pageWithin } from "@/ui/list-pages";
import type { PenaltiesParams } from "./penalty-address";
import {
  type ContinuationCondition,
  type ContinuationDecision,
  PENALTIES_PAGE_SIZE,
  type PenaltyStatus,
  type SocialWorkForm,
  type SocialWorkPlace,
} from "./penalty-ids";
import { semesterOnDay } from "./penalty-semester";
import { HAS_AGENCY } from "./penalty-student";

/** The four numbers of the tab, of the students the account sees. */
export interface PenaltyNumbers {
  /** Pelanggaran ringan. */
  light: number;
  /** Pelanggaran sedang. */
  medium: number;
  /** Pelanggaran berat. */
  heavy: number;
  /** Kerja sosial belum selesai: penalties with kerja sosial not yet Selesai dijalani. */
  unfinishedWork: number;
}

/** One penalty of the list, with all that "Rincian" shows. */
export interface PenaltyRow {
  id: string;
  studentId: string;
  name: string;
  nim: string;
  program: string;
  day: string;
  description: string;
  category: PenaltyCategory;
  level: PenaltyLevel;
  status: PenaltyStatus;
  decisionNumber: string;
  socialWorkForms: SocialWorkForm[];
  socialWorkOther: string;
  socialWorkPlace: SocialWorkPlace | null;
  socialWorkStartsOn: string | null;
  socialWorkEndsOn: string | null;
  savedByName: string;
  /** The student's semester on the Tanggal pelanggaran; null when it falls in no academic period. */
  semester: number | null;
  conditionsMet: ContinuationCondition[];
  decision: ContinuationDecision;
  version: number;
  /** Whether the student has an Instansi asal now, for Syarat melanjutkan studi. */
  hasAgency: boolean;
}

export interface PenaltyList {
  rows: PenaltyRow[];
  /** How many penalties match in all. */
  matching: number;
  /** The page shown, the last one when a later one was asked for. */
  page: number;
}

/** What the tab shows: its numbers and the list. */
export interface PenaltyBoard {
  numbers: PenaltyNumbers;
  list: PenaltyList;
  /** Whether the account sees only its own mentees: "Menampilkan mahasiswa binaan Anda." */
  menteesOnly: boolean;
}

const NO_NUMBERS: PenaltyNumbers = {
  light: 0,
  medium: 0,
  heavy: 0,
  unfinishedWork: 0,
};

function nameOrNim(query: string): SQL | undefined {
  if (query === "") return undefined;
  const pattern = containsPattern(query);
  return or(ilike(students.name, pattern), ilike(students.nim, pattern));
}

function categoryIs(category: PenaltiesParams["category"]): SQL | undefined {
  if (category === "all") return undefined;
  return eq(disciplinePenalties.category, category);
}

function statusIs(status: PenaltiesParams["status"]): SQL | undefined {
  if (status === "all") return undefined;
  return eq(disciplinePenalties.status, status);
}

function countOf(condition: SQL | undefined) {
  return sql<number>`count(*) filter (where ${condition})`.mapWith(Number);
}

/** A penalty with kerja sosial not yet Selesai dijalani, whatever its last day. */
const UNFINISHED_WORK = and(
  isNotNull(disciplinePenalties.socialWorkStartsOn),
  ne(disciplinePenalties.status, "served"),
);

async function readNumbers(db: Database, seen: SQL): Promise<PenaltyNumbers> {
  const [found] = await db
    .select({
      light: countOf(eq(disciplinePenalties.category, "light")),
      medium: countOf(eq(disciplinePenalties.category, "medium")),
      heavy: countOf(eq(disciplinePenalties.category, "heavy")),
      unfinishedWork: countOf(UNFINISHED_WORK),
    })
    .from(disciplinePenalties)
    .innerJoin(students, eq(students.id, disciplinePenalties.studentId))
    .where(seen);
  return found ?? NO_NUMBERS;
}

async function readList(
  db: Database,
  seen: SQL,
  params: PenaltiesParams,
): Promise<PenaltyList> {
  const where = and(
    seen,
    categoryIs(params.category),
    statusIs(params.status),
    nameOrNim(params.query),
  );
  const [counted] = await db
    .select({ matching: count() })
    .from(disciplinePenalties)
    .innerJoin(students, eq(students.id, disciplinePenalties.studentId))
    .where(where);
  const matching = counted?.matching ?? 0;
  const page = pageWithin(params.page, matching, PENALTIES_PAGE_SIZE);
  const found = await db
    .select({
      id: disciplinePenalties.id,
      studentId: disciplinePenalties.studentId,
      name: students.name,
      nim: students.nim,
      program: studyPrograms.name,
      cohortYear: students.cohortYear,
      day: disciplinePenalties.day,
      description: disciplinePenalties.description,
      category: disciplinePenalties.category,
      level: disciplinePenalties.level,
      status: disciplinePenalties.status,
      decisionNumber: disciplinePenalties.decisionNumber,
      socialWorkForms: disciplinePenalties.socialWorkForms,
      socialWorkOther: disciplinePenalties.socialWorkOther,
      socialWorkPlace: disciplinePenalties.socialWorkPlace,
      socialWorkStartsOn: disciplinePenalties.socialWorkStartsOn,
      socialWorkEndsOn: disciplinePenalties.socialWorkEndsOn,
      savedByName: accounts.name,
      conditionsMet: disciplinePenalties.conditionsMet,
      decision: disciplinePenalties.decision,
      version: disciplinePenalties.version,
      hasAgency: HAS_AGENCY,
    })
    .from(disciplinePenalties)
    .innerJoin(students, eq(students.id, disciplinePenalties.studentId))
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .innerJoin(accounts, eq(accounts.id, disciplinePenalties.savedBy))
    .where(where)
    .orderBy(
      desc(disciplinePenalties.day),
      desc(disciplinePenalties.savedAt),
      desc(disciplinePenalties.id),
    )
    .limit(PENALTIES_PAGE_SIZE)
    .offset((page - 1) * PENALTIES_PAGE_SIZE);
  const periods = found.length > 0 ? await readAcademicPeriods(db) : [];
  const rows = found.map(({ cohortYear, ...row }) => ({
    ...row,
    semester: semesterOnDay(cohortYear, periods, row.day),
  }));
  return { rows, matching, page };
}

/** Whether a limit is that of a Pengasuh alone: their own mentees. */
function isMenteesOnly(limit: RowLimit): boolean {
  if (limit.kind === "all") return false;
  return limit.menteesOf.length > 0 && limit.studyProgramIds.length === 0;
}

/**
 * Pelanggaran disiplin for an account that may read discipline records:
 * the numbers and one page of the penalties that match the search and
 * the filters, of the students the account may see by that right,
 * Ketua Program Studi their own program only and Pengasuh their own
 * mentees only. Null, with nothing read, for any other account.
 */
export async function readPenaltyBoard(
  db: Database,
  actor: AccountForAccess,
  params: PenaltiesParams,
): Promise<PenaltyBoard | null> {
  if (!may(actor.roles, "view_discipline_records")) return null;
  const limit = rowLimitForAction(actor, "view_discipline_records");
  const seen = visibleTo(limit);
  const [numbers, list] = await Promise.all([
    readNumbers(db, seen),
    readList(db, seen, params),
  ]);
  return { numbers, list, menteesOnly: isMenteesOnly(limit) };
}

/**
 * "Kerja sosial belum selesai" as the tab shows it to the account, read
 * alone after a status changed so the list is not read again. Zero for
 * an account that may not read discipline records.
 */
export async function readUnfinishedWork(
  db: Database,
  actor: AccountForAccess,
): Promise<number> {
  if (!may(actor.roles, "view_discipline_records")) return 0;
  const seen = visibleTo(rowLimitForAction(actor, "view_discipline_records"));
  const [found] = await db
    .select({ unfinishedWork: count() })
    .from(disciplinePenalties)
    .innerJoin(students, eq(students.id, disciplinePenalties.studentId))
    .where(and(seen, UNFINISHED_WORK));
  return found?.unfinishedWork ?? 0;
}
