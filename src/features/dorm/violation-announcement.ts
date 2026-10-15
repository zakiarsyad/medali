import { and, asc, count, desc, eq, type SQL } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { dormViolations, students } from "@/db/schema";
import type { DormId } from "@/dorms/dorms";
import { pageWithin } from "@/ui/list-pages";
import { announcedBy } from "./violation-conditions";
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

/** What a list of announced violations reads of each. */
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
 * before its hour, and a cancelled one never. The earliest announced
 * first, then by name, 20 a page.
 */
export async function readAnnouncement(
  db: Database,
  scope: SQL | undefined,
  now: Date,
  askedDay: string | null,
  page: number,
): Promise<Announcement> {
  const announced = and(announcedBy(now), scope);
  const days = await readDays(db, announced);
  const chosen = days.find((each) => each.day === askedDay) ?? days[0];
  if (!chosen) return { days, day: null, rows: [], matching: 0, page: 1 };
  const shown = pageWithin(page, chosen.count, VIOLATIONS_PAGE_SIZE);
  const rows = await db
    .select(ANNOUNCED_FIELDS)
    .from(dormViolations)
    .innerJoin(students, eq(students.id, dormViolations.studentId))
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
