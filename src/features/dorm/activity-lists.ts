import { and, asc, count, desc, eq, isNull, ne } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { dormActivities, dormActivityVersions } from "@/db/schema";
import { PAGE_SIZE, pageWithin } from "@/ui/list-pages";
import { ONE_OFF } from "./activity-ids";
import { readVersions, rowOf, selectVersions } from "./activity-reads";
import type { ActivityRow } from "./activity-row";

/** What an activity that is not removed holds now: its newest version. */
const CURRENT = and(
  isNull(dormActivityVersions.shownUntil),
  isNull(dormActivities.deletedAt),
);

const ONE_OFFS = and(CURRENT, eq(dormActivityVersions.pattern, ONE_OFF));

/**
 * Kegiatan rutin: every repeating activity that is not removed, as it is
 * now, by its first hour and then by name.
 */
export function listRoutines(db: Database): Promise<ActivityRow[]> {
  return readVersions(
    db,
    and(CURRENT, ne(dormActivityVersions.pattern, ONE_OFF)),
  );
}

/** One page of Kegiatan non rutin, and how many there are in all. */
export interface OneOffPage {
  activities: ActivityRow[];
  matching: number;
  /** The page shown: the one asked for, or the last one there is. */
  page: number;
}

async function countOneOffs(db: Database): Promise<number> {
  const [counted] = await db
    .select({ matching: count() })
    .from(dormActivityVersions)
    .innerJoin(
      dormActivities,
      eq(dormActivities.id, dormActivityVersions.activityId),
    )
    .where(ONE_OFFS);
  return counted?.matching ?? 0;
}

/**
 * Kegiatan non rutin: one page of the one-off activities that are not
 * removed, the latest date first; two of one day keep one order on every
 * page.
 */
export async function listOneOffs(
  db: Database,
  page: number,
): Promise<OneOffPage> {
  const matching = await countOneOffs(db);
  const shownPage = pageWithin(page, matching);
  const rows = await selectVersions(db, ONE_OFFS)
    .orderBy(
      desc(dormActivityVersions.startsOn),
      asc(dormActivityVersions.startTime),
      asc(dormActivityVersions.id),
    )
    .limit(PAGE_SIZE)
    .offset((shownPage - 1) * PAGE_SIZE);
  return { activities: rows.map(rowOf), matching, page: shownPage };
}
