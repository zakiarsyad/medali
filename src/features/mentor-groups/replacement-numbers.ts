import { and, count, eq, gte, isNull, lt } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { mentorGroups, mentorReplacements } from "@/db/schema";
import { yearDaysOf } from "./replacement-year";
import { countReserveMentors } from "./spare-mentors";
import { groupsVisibleTo } from "./visible-groups";

/** What the number "Penggantian tahun ini" shows. */
export interface ReplacementNumbers {
  /** The replacements of this calendar year that are not cancelled. */
  thisYear: number;
  /**
   * How many mentors are Cadangan, or null for an account that does not
   * see every mentor: it is told no number of mentors it cannot list.
   */
  spares: number | null;
}

/**
 * How many replacements of the groups an account with this limit may see
 * are not cancelled and start in the calendar year of `today`. The
 * database counts, by the days a check keeps the same as `countsThisYear`.
 * A replacement is seen through its group, as in "Riwayat penggantian".
 */
export async function countReplacementsThisYear(
  db: Database,
  limit: RowLimit,
  today: string = campusDay(),
): Promise<number> {
  const year = yearDaysOf(today);
  const [counted] = await db
    .select({ thisYear: count() })
    .from(mentorReplacements)
    .innerJoin(mentorGroups, eq(mentorGroups.id, mentorReplacements.groupId))
    .where(
      and(
        groupsVisibleTo(limit),
        isNull(mentorReplacements.cancelledAt),
        gte(mentorReplacements.startsOn, year.from),
        lt(mentorReplacements.startsOn, year.before),
      ),
    );
  return counted?.thisYear ?? 0;
}

/**
 * "Penggantian tahun ini" with the count of spare mentors under it.
 * `limit` holds the groups whose replacements the account may see, and
 * `mentorLimit` the mentors it may see, or null for none.
 */
export async function readReplacementNumbers(
  db: Database,
  limit: RowLimit,
  mentorLimit: RowLimit | null,
): Promise<ReplacementNumbers> {
  const seesEveryMentor = mentorLimit?.kind === "all";
  const [thisYear, spares] = await Promise.all([
    countReplacementsThisYear(db, limit),
    seesEveryMentor ? countReserveMentors(db) : null,
  ]);
  return { thisYear, spares };
}
