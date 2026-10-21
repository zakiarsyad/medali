import { and, count, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { periodTitle } from "@/academic-periods/period-labels";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import {
  accounts,
  dormViolations,
  dormWarningLetters,
  students,
} from "@/db/schema";
import { pageWithin } from "@/ui/list-pages";
import { escalatedBy, inPeriodDays } from "./violation-conditions";
import { periodDays } from "./violation-periods";
import { WARNINGS_PAGE_SIZE } from "./warning-ids";

/** What Kepala Unit wrote when marking a proposal Diproses. */
export interface ProposalHandling {
  /** Catatan tindak lanjut. */
  note: string;
  /** The name of the account that handled it. */
  by: string;
  at: Date;
}

/** One row of "Pengajuan hukuman disiplin dari Pengelola Asrama". */
export interface DisciplineProposal {
  /** The key of the SP 2 the proposal came with. */
  letterId: string;
  studentId: string;
  name: string;
  nim: string;
  /** The semester of the SP 2, as the screens name it. */
  semesterTitle: string;
  /** Violations of that semester gone up to Pengelola Asrama that still count. */
  counted: number;
  /** The day of the SP 2 clarification: of its call, or of the SP without one. */
  clarifiedOn: string;
  /** Hasil klarifikasi of the SP 2. */
  result: string;
  /** Catatan pengajuan hukuman disiplin ke Kepala UPK; may be empty. */
  proposalNote: string;
  /** When the SP 2 was issued, and so the proposal sent. */
  proposedAt: Date;
  /** Null while it is Diajukan. */
  handling: ProposalHandling | null;
}

export interface DisciplineProposals {
  rows: DisciplineProposal[];
  /** How many proposals there are in all. */
  matching: number;
  page: number;
}

const IS_PROPOSAL = and(
  eq(dormWarningLetters.level, 2),
  isNotNull(dormWarningLetters.issuedAt),
);

function readPage(
  db: Database,
  visible: ReturnType<typeof visibleTo>,
  page: number,
) {
  return db
    .select({
      letterId: dormWarningLetters.id,
      studentId: students.id,
      name: students.name,
      nim: students.nim,
      periodId: dormWarningLetters.periodId,
      callDay: dormWarningLetters.callDay,
      result: dormWarningLetters.result,
      proposalNote: dormWarningLetters.proposalNote,
      issuedAt: dormWarningLetters.issuedAt,
      handlingNote: dormWarningLetters.handlingNote,
      handledAt: dormWarningLetters.handledAt,
      handlerName: accounts.name,
    })
    .from(dormWarningLetters)
    .innerJoin(students, eq(students.id, dormWarningLetters.studentId))
    .leftJoin(accounts, eq(accounts.id, dormWarningLetters.handledBy))
    .where(and(IS_PROPOSAL, visible))
    .orderBy(desc(dormWarningLetters.issuedAt), desc(dormWarningLetters.id))
    .limit(WARNINGS_PAGE_SIZE)
    .offset((page - 1) * WARNINGS_PAGE_SIZE);
}

type Periods = Awaited<ReturnType<typeof readAcademicPeriods>>;

/**
 * How many violations of a semester went up to Pengelola Asrama at `now`
 * and still count, for each of some students, by student.
 */
async function countedIn(
  db: Database,
  periods: Periods,
  periodId: string,
  studentIds: string[],
  now: Date,
): Promise<Map<string, number>> {
  const counted = new Map<string, number>();
  const days = periodDays(periods, periodId);
  if (days === null) return counted;
  const rows = await db
    .select({ studentId: dormViolations.studentId, amount: count() })
    .from(dormViolations)
    .where(
      and(
        escalatedBy(now),
        inPeriodDays(days),
        inArray(dormViolations.studentId, studentIds),
      ),
    )
    .groupBy(dormViolations.studentId);
  for (const row of rows) counted.set(row.studentId, row.amount);
  return counted;
}

/** The counted violations of each row, by `${periodId}:${studentId}`. */
async function countedOfRows(
  db: Database,
  periods: Periods,
  rows: { periodId: string; studentId: string }[],
  now: Date,
): Promise<Map<string, number>> {
  const studentsByPeriod = new Map<string, string[]>();
  for (const row of rows) {
    const kept = studentsByPeriod.get(row.periodId) ?? [];
    studentsByPeriod.set(row.periodId, [...kept, row.studentId]);
  }
  const counted = new Map<string, number>();
  for (const [periodId, ids] of studentsByPeriod) {
    const ofPeriod = await countedIn(db, periods, periodId, ids, now);
    for (const [studentId, amount] of ofPeriod) {
      counted.set(`${periodId}:${studentId}`, amount);
    }
  }
  return counted;
}

function handlingOf(row: {
  handlingNote: string | null;
  handledAt: Date | null;
  handlerName: string | null;
}): ProposalHandling | null {
  if (row.handlingNote === null || row.handledAt === null) return null;
  return {
    note: row.handlingNote,
    by: row.handlerName ?? "",
    at: row.handledAt,
  };
}

/**
 * "Pengajuan hukuman disiplin dari Pengelola Asrama": every SP 2 of every
 * semester with its proposal, of the students the account sees, the
 * latest first, 20 a page, with the counted violations of its semester
 * at `now` by the server's clock and how Kepala Unit handled it. Null
 * for an account without the right to read Hasil klarifikasi and the
 * proposal note: only Pengelola Asrama and Kepala Unit have it. A read
 * per semester on the page, however many proposals there are.
 */
export async function readDisciplineProposals(
  db: Database,
  account: AccountForAccess,
  page: number,
  now: Date,
): Promise<DisciplineProposals | null> {
  if (!may(account.roles, "view_dorm_warning_results")) return null;
  const visible = visibleTo(
    rowLimitForAction(account, "view_dorm_warning_results"),
  );
  const [counted] = await db
    .select({ matching: count() })
    .from(dormWarningLetters)
    .innerJoin(students, eq(students.id, dormWarningLetters.studentId))
    .where(and(IS_PROPOSAL, visible));
  const matching = counted?.matching ?? 0;
  const shown = pageWithin(page, matching, WARNINGS_PAGE_SIZE);
  if (matching === 0) return { rows: [], matching, page: shown };
  const [rows, periods] = await Promise.all([
    readPage(db, visible, shown),
    readAcademicPeriods(db),
  ]);
  const violations = await countedOfRows(db, periods, rows, now);
  const proposals: DisciplineProposal[] = [];
  for (const row of rows) {
    if (row.issuedAt === null) continue;
    const period = periods.find((each) => each.id === row.periodId);
    proposals.push({
      letterId: row.letterId,
      studentId: row.studentId,
      name: row.name,
      nim: row.nim,
      semesterTitle: period ? periodTitle(period) : "",
      counted: violations.get(`${row.periodId}:${row.studentId}`) ?? 0,
      clarifiedOn: row.callDay ?? campusDay(row.issuedAt),
      result: row.result,
      proposalNote: row.proposalNote,
      proposedAt: row.issuedAt,
      handling: handlingOf(row),
    });
  }
  return { rows: proposals, matching, page: shown };
}
