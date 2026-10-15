import { and, asc, eq, isNotNull } from "drizzle-orm";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { dormWarningLetters, students } from "@/db/schema";
import { readSchedules } from "./warning-calls";
import type { CallSchedule, WarningLevel } from "./warning-ids";
import { type RejectedClarification, readRejected } from "./warning-process";
import { causesOf } from "./warning-rule";
import {
  readStandingOf,
  readWarningSemester,
  type StandingWithLevel,
} from "./warning-standing";

/** An SP the resident received, as only they, Pengelola Asrama and Kepala Unit read it. */
export interface OwnLetter {
  level: WarningLevel;
  issuedAt: Date;
  /** Hasil klarifikasi. */
  result: string;
}

/** Where a resident stands toward an SP in the running semester. */
export interface OwnWarning {
  semesterTitle: string;
  standing: StandingWithLevel;
  /** Why they are called, or empty when they are not. */
  causes: string[];
  /** The call of the SP they are called for, or null while none is sent. */
  schedule: CallSchedule | null;
  /** The SPs they received in the semester, SP 1 first. */
  letters: OwnLetter[];
  /** Their clarifications of the semester rejected last, which count toward an SP. */
  rejected: RejectedClarification[];
}

async function readLetters(
  db: Database,
  semesterId: string,
  studentId: string,
): Promise<OwnLetter[]> {
  const rows = await db
    .select({
      level: dormWarningLetters.level,
      issuedAt: dormWarningLetters.issuedAt,
      result: dormWarningLetters.result,
    })
    .from(dormWarningLetters)
    .where(
      and(
        eq(dormWarningLetters.periodId, semesterId),
        eq(dormWarningLetters.studentId, studentId),
        isNotNull(dormWarningLetters.issuedAt),
      ),
    )
    .orderBy(asc(dormWarningLetters.level));
  const letters: OwnLetter[] = [];
  for (const row of rows) {
    if (row.issuedAt === null) continue;
    const level = row.level === 2 ? 2 : 1;
    letters.push({ level, issuedAt: row.issuedAt, result: row.result });
  }
  return letters;
}

/**
 * The resident's own standing toward an SP in the running semester, at
 * `now` by the server's clock: their counts, the SP they are called for
 * with why and its call, the SPs they received with Hasil klarifikasi,
 * and their rejected clarifications. The student is the account's own,
 * never one the address names. Null for an account without the right to
 * see its own violations or without a student, and while no period is
 * stored.
 */
export async function readOwnWarning(
  db: Database,
  account: AccountForAccess,
  now: Date,
): Promise<OwnWarning | null> {
  const { studentId } = account;
  if (!may(account.roles, "view_own_dorm_violations")) return null;
  if (studentId === null) return null;
  const semester = await readWarningSemester(db, now);
  if (semester === null) return null;
  const own = eq(students.id, studentId);
  const [standing, letters, rejected, schedules] = await Promise.all([
    readStandingOf(db, semester, own, studentId, now),
    readLetters(db, semester.id, studentId),
    readRejected(db, semester, own),
    readSchedules(db, semester.id, [studentId]),
  ]);
  if (standing === null) return null;
  const { level } = standing;
  return {
    semesterTitle: semester.title,
    standing,
    causes: level === null ? [] : causesOf(standing, level),
    schedule:
      level === null ? null : (schedules.get(`${studentId}:${level}`) ?? null),
    letters,
    rejected,
  };
}
