import { and, count, desc, eq, isNotNull, type SQL } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { accounts, dormViolations, students } from "@/db/schema";
import { pageWithin } from "@/ui/list-pages";
import { inPeriodDays } from "./violation-conditions";
import { type Punishment, VIOLATIONS_PAGE_SIZE } from "./violation-ids";
import type { PeriodDays } from "./violation-periods";

/** A reduced violation, as "Riwayat pengurangan pelanggaran" shows it. */
export interface ShownReduction {
  /** The violation. */
  id: string;
  studentId: string;
  name: string;
  nim: string;
  day: string;
  reason: string;
  punishment: Punishment;
  otherPunishment: string;
  /** Dasar pengurangan. */
  reductionReason: string;
  /** The name of the account that reduced it. */
  reducedBy: string;
  reducedAt: Date;
}

export interface ReductionList {
  rows: ShownReduction[];
  /** How many violations of the semester are reduced. */
  matching: number;
  page: number;
}

/**
 * "Riwayat pengurangan pelanggaran": the violations of the students
 * `visible` holds, on a day of the semester, that are reduced now, the
 * latest reduced first, 20 a page. An undone reduction leaves the list;
 * the log keeps it.
 */
export async function readReductionList(
  db: Database,
  visible: SQL,
  semester: PeriodDays,
  page: number,
): Promise<ReductionList> {
  const where = and(
    visible,
    isNotNull(dormViolations.reducedAt),
    inPeriodDays(semester),
  );
  const [counted] = await db
    .select({ matching: count() })
    .from(dormViolations)
    .innerJoin(students, eq(students.id, dormViolations.studentId))
    .where(where);
  const matching = counted?.matching ?? 0;
  const shown = pageWithin(page, matching, VIOLATIONS_PAGE_SIZE);
  const rows = await db
    .select({
      id: dormViolations.id,
      studentId: dormViolations.studentId,
      name: students.name,
      nim: students.nim,
      day: dormViolations.day,
      reason: dormViolations.reason,
      punishment: dormViolations.punishment,
      otherPunishment: dormViolations.otherPunishment,
      reductionReason: dormViolations.reductionReason,
      reducedBy: accounts.name,
      reducedAt: dormViolations.reducedAt,
    })
    .from(dormViolations)
    .innerJoin(students, eq(students.id, dormViolations.studentId))
    .innerJoin(accounts, eq(accounts.id, dormViolations.reducedBy))
    .where(where)
    .orderBy(desc(dormViolations.reducedAt), desc(dormViolations.id))
    .limit(VIOLATIONS_PAGE_SIZE)
    .offset((shown - 1) * VIOLATIONS_PAGE_SIZE);
  return { rows: rows.flatMap(withMoment), matching, page: shown };
}

/** A row read where the moment cannot be empty, typed as such. */
function withMoment<Row extends { reducedAt: Date | null }>(
  row: Row,
): (Row & { reducedAt: Date })[] {
  const { reducedAt } = row;
  if (reducedAt === null) return [];
  return [{ ...row, reducedAt }];
}
