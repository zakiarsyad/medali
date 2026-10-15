import { and, asc, count, desc, eq, gt, inArray } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { readDormCohorts } from "@/dorms/dorm-cohorts";
import { dormInSql } from "@/dorms/resident-condition";
import { pageWithin } from "@/ui/list-pages";
import { roomWords } from "./leave-list";
import { readStandingPage } from "./warning-calls";
import { WARNINGS_PAGE_SIZE, type WarningLevel } from "./warning-ids";
import { readRejected } from "./warning-process";
import { causesOf, letterMark } from "./warning-rule";
import {
  readWarningSemester,
  standingOf,
  standingsOf,
} from "./warning-standing";

/** One resident of "Klarifikasi ditolak dan penetapan SP". */
export interface RejectedRow {
  studentId: string;
  name: string;
  nim: string;
  room: string;
  /** How many of their clarifications of the semester were rejected last. */
  rejected: number;
  /** The day and activity of the last one rejected, as the screens show them. */
  lastDay: string;
  lastActivity: string;
  /** The SP they are called for, with why, or null. */
  level: WarningLevel | null;
  causes: string[];
  /** The highest SP issued in the semester, or none. */
  mark: WarningLevel | null;
}

export interface RejectedPanel {
  rows: RejectedRow[];
  matching: number;
  page: number;
}

/**
 * Whether an account gets the panel on Klarifikasi kehadiran: one that
 * sees the clarifications and the violations, as it shows SPs. Direktur
 * and Ketua Program Studi see the clarifications only.
 */
export function seesRejectedPanel(roles: readonly RoleId[]): boolean {
  return (
    may(roles, "view_dorm_clarifications") && may(roles, "view_dorm_violations")
  );
}

/**
 * "Klarifikasi ditolak dan penetapan SP" of the running semester, at
 * `now` by the server's clock: each resident the account sees through
 * its right to see violations whose clarification was rejected and
 * still counts, the most rejections first, 20 a page, with the last one
 * and their SP status. Null for an account that does not get the panel,
 * whatever it asks, and while no period is stored.
 */
export async function readRejectedPanel(
  db: Database,
  account: AccountForAccess,
  now: Date,
  page: number,
): Promise<RejectedPanel | null> {
  if (!seesRejectedPanel(account.roles)) return null;
  const semester = await readWarningSemester(db, now);
  if (semester === null) return null;
  const visible = visibleTo(rowLimitForAction(account, "view_dorm_violations"));
  const standing = standingsOf(db, semester, now);
  const where = and(visible, gt(standing.rejected, 0));
  const [[counted], dormCohorts] = await Promise.all([
    db
      .select({ matching: count() })
      .from(standing)
      .innerJoin(students, eq(students.id, standing.studentId))
      .where(where),
    readDormCohorts(db, campusDay(now)),
  ]);
  const matching = counted?.matching ?? 0;
  const shown = pageWithin(page, matching, WARNINGS_PAGE_SIZE);
  const rows = await readStandingPage(
    db,
    standing,
    where,
    [desc(standing.rejected), asc(students.name), asc(students.nim)],
    dormInSql(dormCohorts ?? []),
    shown,
  );
  const ids = rows.map((row) => row.studentId);
  const rejected =
    ids.length === 0
      ? []
      : await readRejected(db, semester, inArray(students.id, ids));
  const last = new Map<string, (typeof rejected)[number]>();
  for (const each of rejected) last.set(each.studentId, each);
  return {
    rows: rows.map((row) => {
      const kept = standingOf(row);
      const latest = last.get(row.studentId);
      return {
        studentId: row.studentId,
        name: row.name,
        nim: row.nim,
        room: roomWords(row.dorm, row.room),
        rejected: row.rejected,
        lastDay: latest?.day ?? "-",
        lastActivity: latest?.activity ?? "-",
        level: row.level,
        causes: row.level === null ? [] : causesOf(kept, row.level),
        mark: letterMark(kept),
      };
    }),
    matching,
    page: shown,
  };
}
