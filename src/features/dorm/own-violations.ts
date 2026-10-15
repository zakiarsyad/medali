import { and, asc, count, desc, eq, type SQL } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { periodTitle } from "@/academic-periods/period-labels";
import { runningPeriodOn } from "@/academic-periods/running-period";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import { type AccountForAccess, may } from "@/auth/access";
import { NOT_REMOVED } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { dormViolationAppeals, dormViolations, students } from "@/db/schema";
import type { DormId } from "@/dorms/dorms";
import { pageWithin } from "@/ui/list-pages";
import type { AppealStatus } from "./appeal-ids";
import { type OwnWarning, readOwnWarning } from "./own-warning";
import type { SemesterChoice } from "./rekap-filters";
import { readStudentDorm } from "./student-dorm";
import type { OwnViolationParams } from "./violation-address";
import {
  ANNOUNCED_FIELDS,
  type AnnouncedViolation,
  type Announcement,
  APPEAL_OF_VIOLATION,
  readAnnouncement,
} from "./violation-announcement";
import {
  APPEAL_ACCEPTED,
  announcedBy,
  escalatedBy,
  inAppealOrWaitingAt,
  inPeriodDays,
} from "./violation-conditions";
import { VIOLATIONS_PAGE_SIZE } from "./violation-ids";
import { periodDays } from "./violation-periods";

/** The appeal of a resident's own violation, as only they see it. */
export interface OwnAppeal {
  id: string;
  status: AppealStatus;
  reason: string;
  /** Catatan BAM; empty when nothing was noted. */
  note: string;
  /** The name of the proof, or null for an appeal without one. */
  proofName: string | null;
}

export interface OwnViolation extends AnnouncedViolation {
  ownAppeal: OwnAppeal | null;
}

/** "Rekam jejak pelanggaran saya": one page of the resident's own violations. */
export interface OwnHistory {
  rows: OwnViolation[];
  matching: number;
  page: number;
}

/** A resident's own record: their numbers and "Rekam jejak pelanggaran saya". */
export interface OwnRecordData {
  dorm: DormId;
  /** "Pelanggaran tercatat": gone up to Pengelola Asrama, in the running semester. */
  recorded: number;
  /** "Dalam masa advokasi": in Masa advokasi or Advokasi diproses now, of any day. */
  inAppeal: number;
  /** "Advokasi diterima": accepted, in the running semester. */
  accepted: number;
  /** The running semester, or null while no period is stored. */
  semester: SemesterChoice | null;
  periods: SemesterChoice[];
  /** The period the history shows: a key, or "all" for every one. */
  shownPeriod: string;
  history: OwnHistory;
  /** Where they stand toward an SP in the running semester, or null while no period is stored. */
  warning: OwnWarning | null;
}

export type OwnRecordRead =
  | { kind: "refused" }
  | ({ kind: "shown" } & OwnRecordData);

export type OwnViolations =
  | { kind: "refused" }
  | ({ kind: "shown"; announcement: Announcement } & OwnRecordData);

const REFUSED = { kind: "refused" } as const;

async function countWhere(db: Database, where: SQL | undefined) {
  const [counted] = await db
    .select({ amount: count() })
    .from(dormViolations)
    .where(where);
  return counted?.amount ?? 0;
}

/** A violation with no appeal reads its appeal as null. */
const OWN_FIELDS = {
  ...ANNOUNCED_FIELDS,
  ownAppeal: {
    id: dormViolationAppeals.id,
    status: dormViolationAppeals.status,
    reason: dormViolationAppeals.reason,
    note: dormViolationAppeals.decisionNote,
    proofName: dormViolationAppeals.fileName,
  },
};

async function readHistory(
  db: Database,
  where: SQL | undefined,
  page: number,
): Promise<OwnHistory> {
  const matching = await countWhere(db, where);
  const shown = pageWithin(page, matching, VIOLATIONS_PAGE_SIZE);
  const rows = await db
    .select(OWN_FIELDS)
    .from(dormViolations)
    .innerJoin(students, eq(students.id, dormViolations.studentId))
    .leftJoin(dormViolationAppeals, APPEAL_OF_VIOLATION)
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
 * The own record of a resident, at `now` by the server's clock: how many
 * of their own violations of the running semester went up to Pengelola
 * Asrama and how many of them had their appeal accepted, how many of
 * their own are in their appeal time or wait for BAM, their own
 * announced violations of the period chosen, and where they stand
 * toward an SP. The student is the
 * account's own, never one the address names. Refused for an account
 * without the right, or whose student lives in no dorm.
 */
export async function readOwnRecord(
  db: Database,
  account: AccountForAccess,
  params: Pick<OwnViolationParams, "periodId" | "page">,
  now: Date,
): Promise<OwnRecordRead> {
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
  const ofRunning = (where: SQL | undefined) =>
    runningDays === null
      ? 0
      : countWhere(db, and(own, where, inPeriodDays(runningDays)));
  const [recorded, inAppeal, accepted, history, warning] = await Promise.all([
    ofRunning(escalatedBy(now)),
    countWhere(db, and(own, inAppealOrWaitingAt(now))),
    ofRunning(APPEAL_ACCEPTED),
    readHistory(db, and(own, announcedBy(now), ofPeriod), params.page),
    readOwnWarning(db, account, now),
  ]);
  return {
    kind: "shown",
    dorm,
    recorded,
    inAppeal,
    accepted,
    semester:
      running === null ? null : { id: running.id, title: periodTitle(running) },
    periods: periods.map((each) => ({ id: each.id, title: periodTitle(each) })),
    shownPeriod: chosen === null ? "all" : chosen.id,
    history,
    warning,
  };
}

/**
 * Pelanggaran for a resident: their own record, and the announcement of
 * the dorm they live in today, of its residents only. Refused as the
 * record is.
 */
export async function readOwnViolations(
  db: Database,
  account: AccountForAccess,
  params: OwnViolationParams,
  now: Date,
): Promise<OwnViolations> {
  const record = await readOwnRecord(db, account, params, now);
  if (record.kind === "refused") return record;
  const ofDorm = and(eq(dormViolations.dorm, record.dorm), NOT_REMOVED);
  const announcement = await readAnnouncement(
    db,
    ofDorm,
    now,
    params.day,
    params.announcementPage,
  );
  return { ...record, announcement };
}
