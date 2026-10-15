import { and, asc, count, desc, eq, type SQL, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { dormViolationAppeals, dormViolations, students } from "@/db/schema";
import type { DormId } from "@/dorms/dorms";
import { pageWithin } from "@/ui/list-pages";
import type { AppealStatus } from "./appeal-ids";
import { announcedBy, NOT_REDUCED } from "./violation-conditions";
import { type Punishment, VIOLATIONS_PAGE_SIZE } from "./violation-ids";

/** An announced violation, as the lists of the tab show it. */
export interface AnnouncedViolation {
  id: string;
  day: string;
  studentId: string;
  name: string;
  nim: string;
  dorm: DormId;
  reason: string;
  punishment: Punishment;
  otherPunishment: string;
  announcedAt: Date;
  /** Only the result of its appeal, or null without one: never its reason. */
  appeal: AppealStatus | null;
  /** Only whether Pengelola Asrama reduced it: residents never see who or when. */
  reduced: boolean;
  /** Dasar pengurangan; empty while it is not reduced. */
  reductionReason: string;
}

/** A violation day with announced violations, and how many. */
export interface AnnouncementDay {
  day: string;
  count: number;
}

/** "Pengumuman pelanggaran": the days to choose from, and one day's page. */
export interface Announcement {
  /** Every day with an announced violation, the latest first. */
  days: AnnouncementDay[];
  /** The day shown, or null when nothing is announced. */
  day: string | null;
  rows: AnnouncedViolation[];
  /** How many announced violations the day holds. */
  matching: number;
  page: number;
}

/** The appeal of a violation, for the lists, which read only its status. */
export const APPEAL_OF_VIOLATION = eq(
  dormViolationAppeals.violationId,
  dormViolations.id,
);

/**
 * What a list of announced violations reads of each. Its read joins the
 * students, and the appeals by `APPEAL_OF_VIOLATION` with a left join.
 */
export const ANNOUNCED_FIELDS = {
  id: dormViolations.id,
  day: dormViolations.day,
  studentId: dormViolations.studentId,
  name: students.name,
  nim: students.nim,
  dorm: dormViolations.dorm,
  reason: dormViolations.reason,
  punishment: dormViolations.punishment,
  otherPunishment: dormViolations.otherPunishment,
  announcedAt: dormViolations.announcedAt,
  appeal: dormViolationAppeals.status,
  reduced: sql<boolean>`${dormViolations.reducedAt} is not null`,
  reductionReason: dormViolations.reductionReason,
};

/** The days with announced violations, the latest first. */
async function readDays(
  db: Database,
  where: SQL | undefined,
): Promise<AnnouncementDay[]> {
  return db
    .select({ day: dormViolations.day, count: count() })
    .from(dormViolations)
    .innerJoin(students, eq(students.id, dormViolations.studentId))
    .where(where)
    .groupBy(dormViolations.day)
    .orderBy(desc(dormViolations.day));
}

/**
 * "Pengumuman pelanggaran": the violations announced at `now`, by the
 * server's clock, of the students `scope` holds, for one violation day:
 * the day asked for when it has any, or else the latest. Nothing shows
 * before its hour, and a cancelled or reduced one never. The earliest
 * announced first, then by name, 20 a page.
 */
export async function readAnnouncement(
  db: Database,
  scope: SQL | undefined,
  now: Date,
  askedDay: string | null,
  page: number,
): Promise<Announcement> {
  const announced = and(announcedBy(now), NOT_REDUCED, scope);
  const days = await readDays(db, announced);
  const chosen = days.find((each) => each.day === askedDay) ?? days[0];
  if (!chosen) return { days, day: null, rows: [], matching: 0, page: 1 };
  const shown = pageWithin(page, chosen.count, VIOLATIONS_PAGE_SIZE);
  const rows = await db
    .select(ANNOUNCED_FIELDS)
    .from(dormViolations)
    .innerJoin(students, eq(students.id, dormViolations.studentId))
    .leftJoin(dormViolationAppeals, APPEAL_OF_VIOLATION)
    .where(and(announced, eq(dormViolations.day, chosen.day)))
    .orderBy(
      asc(dormViolations.announcedAt),
      asc(students.name),
      asc(dormViolations.id),
    )
    .limit(VIOLATIONS_PAGE_SIZE)
    .offset((shown - 1) * VIOLATIONS_PAGE_SIZE);
  return { days, day: chosen.day, rows, matching: chosen.count, page: shown };
}
