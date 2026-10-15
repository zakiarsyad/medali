import { and, asc, count, desc, eq, type SQL } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { periodTitle } from "@/academic-periods/period-labels";
import { runningPeriodOn } from "@/academic-periods/running-period";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import { type AccountForAccess, may } from "@/auth/access";
import { NOT_REMOVED } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { dormViolations, students } from "@/db/schema";
import type { DormId } from "@/dorms/dorms";
import { pageWithin } from "@/ui/list-pages";
import type { SemesterChoice } from "./rekap-filters";
import { readStudentDorm } from "./student-dorm";
import type { OwnViolationParams } from "./violation-address";
import {
  ANNOUNCED_FIELDS,
  type AnnouncedViolation,
  type Announcement,
  readAnnouncement,
} from "./violation-announcement";
import { announcedBy, escalatedBy, inPeriodDays } from "./violation-conditions";
import { VIOLATIONS_PAGE_SIZE } from "./violation-ids";
import { periodDays } from "./violation-periods";

/** "Rekam jejak pelanggaran saya": one page of the resident's own violations. */
export interface OwnHistory {
  rows: AnnouncedViolation[];
  matching: number;
  page: number;
}

export type OwnViolations =
  | { kind: "refused" }
  | {
      kind: "shown";
      dorm: DormId;
      /** "Pelanggaran tercatat": gone up to Pengelola Asrama, in the running semester. */
      recorded: number;
      /** The running semester, or null while no period is stored. */
      semester: SemesterChoice | null;
      periods: SemesterChoice[];
      /** The period the history shows: a key, or "all" for every one. */
      shownPeriod: string;
      history: OwnHistory;
      announcement: Announcement;
    };

const REFUSED = { kind: "refused" } as const;

async function countWhere(db: Database, where: SQL | undefined) {
  const [counted] = await db
    .select({ amount: count() })
    .from(dormViolations)
    .where(where);
  return counted?.amount ?? 0;
}

async function readHistory(
  db: Database,
  where: SQL | undefined,
  page: number,
): Promise<OwnHistory> {
  const matching = await countWhere(db, where);
  const shown = pageWithin(page, matching, VIOLATIONS_PAGE_SIZE);
  const rows = await db
    .select(ANNOUNCED_FIELDS)
    .from(dormViolations)
    .innerJoin(students, eq(students.id, dormViolations.studentId))
    .where(where)
    .orderBy(
      desc(dormViolations.day),
      desc(dormViolations.announcedAt),
      asc(dormViolations.id),
    )
    .limit(VIOLATIONS_PAGE_SIZE)
    .offset((shown - 1) * VIOLATIONS_PAGE_SIZE);
  return { rows, matching, page: shown };
}

/**
 * Pelanggaran for a resident, at `now` by the server's clock: how many of
 * their own violations of the running semester went up to Pengelola
 * Asrama, their own announced violations of the period chosen, and the
 * announcement of the dorm they live in today, of its residents only.
 * The student is the account's own, never one the address names. Refused
 * for an account without the right, or whose student lives in no dorm.
 */
export async function readOwnViolations(
  db: Database,
  account: AccountForAccess,
  params: OwnViolationParams,
  now: Date,
): Promise<OwnViolations> {
  const { studentId } = account;
  if (!may(account.roles, "view_own_dorm_violations")) return REFUSED;
  if (studentId === null) return REFUSED;
  const dorm = await readStudentDorm(db, studentId, campusDay(now));
  if (dorm === null) return REFUSED;
  const periods = await readAcademicPeriods(db);
  const running = runningPeriodOn(periods, campusDay(now));
  const own = eq(dormViolations.studentId, studentId);
  const runningDays = running === null ? null : periodDays(periods, running.id);
  const chosen =
    params.periodId === "all"
      ? null
      : (periods.find((each) => each.id === params.periodId) ?? running);
  const chosenDays = chosen === null ? null : periodDays(periods, chosen.id);
  const ofPeriod = chosenDays === null ? undefined : inPeriodDays(chosenDays);
  const ofDorm = and(eq(dormViolations.dorm, dorm), NOT_REMOVED);
  const [recorded, history, announcement] = await Promise.all([
    runningDays === null
      ? 0
      : countWhere(db, and(own, escalatedBy(now), inPeriodDays(runningDays))),
    readHistory(db, and(own, announcedBy(now), ofPeriod), params.page),
    readAnnouncement(db, ofDorm, now, params.day, params.announcementPage),
  ]);
  return {
    kind: "shown",
    dorm,
    recorded,
    semester:
      running === null ? null : { id: running.id, title: periodTitle(running) },
    periods: periods.map((each) => ({ id: each.id, title: periodTitle(each) })),
    shownPeriod: chosen === null ? "all" : chosen.id,
    history,
    announcement,
  };
}
