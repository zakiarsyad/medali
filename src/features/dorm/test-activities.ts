import { asc, eq, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  dormActivities,
  dormActivityDaysOff,
  dormActivityVersions,
} from "@/db/schema";
import type { ActivityRow } from "./activity-row";

/** Made-up dorm activities for the checks of this area. */

/** A daily activity for every resident, shown and valid without limits. */
export const TEST_ROW: ActivityRow = {
  id: "00000000-0000-4000-8000-00000000a001",
  version: "2026-10-01T02:03:04.567Z",
  shownFrom: null,
  shownUntil: null,
  removedFrom: null,
  name: "Apel pagi uji",
  category: "roll_call",
  location: "Lapangan uji",
  pattern: "daily",
  weekdays: [],
  monthDay: null,
  startsOn: "2026-08-01",
  endsOn: null,
  startTime: "05:30",
  endTime: "06:15",
  organiser: "coach",
  organiserName: "Tim Pelatih Uji",
  audience: "all",
  isRequired: true,
  rundown: [{ time: "05:30", activity: "Apel uji" }],
  daysOff: [],
};

/** A one-off activity of 14 October 2026, a Wednesday. */
export const TEST_ONE_OFF: ActivityRow = {
  ...TEST_ROW,
  id: "00000000-0000-4000-8000-00000000a002",
  name: "Malam keakraban uji",
  category: "arts_and_culture",
  pattern: "once",
  startsOn: "2026-10-14",
  endsOn: "2026-10-14",
  startTime: "19:00",
  endTime: "21:00",
  organiser: "bam",
  organiserName: "",
  rundown: [],
};

type TestVersion = Partial<typeof dormActivityVersions.$inferInsert>;

interface TestActivity {
  /** Its versions; one daily version without limits when none is given. */
  versions?: TestVersion[];
  daysOff?: string[];
}

const VERSION = {
  name: TEST_ROW.name,
  category: TEST_ROW.category,
  location: TEST_ROW.location,
  pattern: TEST_ROW.pattern,
  weekdays: TEST_ROW.weekdays,
  startsOn: TEST_ROW.startsOn,
  startTime: TEST_ROW.startTime,
  endTime: TEST_ROW.endTime,
  organiser: TEST_ROW.organiser,
  organiserName: TEST_ROW.organiserName,
  audience: TEST_ROW.audience,
  isRequired: TEST_ROW.isRequired,
  rundown: TEST_ROW.rundown,
};

/** A stored activity, last changed by `byId`. Gives back its key. */
export async function addTestActivity(
  db: Database,
  byId: string,
  activity: TestActivity = {},
): Promise<string> {
  const [added] = await db
    .insert(dormActivities)
    .values({ changedAt: new Date(), changedBy: byId })
    .returning({ id: dormActivities.id });
  if (!added) throw new Error("The activity was not added.");
  const versions = activity.versions ?? [{}];
  await db.insert(dormActivityVersions).values(
    versions.map((version) => ({
      ...VERSION,
      ...version,
      activityId: added.id,
    })),
  );
  const daysOff = activity.daysOff ?? [];
  if (daysOff.length > 0) {
    await db
      .insert(dormActivityDaysOff)
      .values(daysOff.map((day) => ({ activityId: added.id, day })));
  }
  return added.id;
}

/** The versions of an activity as kept, the one shown first at the top. */
export function versionsOf(db: Database, activityId: string) {
  return db
    .select()
    .from(dormActivityVersions)
    .where(eq(dormActivityVersions.activityId, activityId))
    .orderBy(sql`${dormActivityVersions.shownFrom} asc nulls first`);
}

/** An activity as kept, or undefined when there is none. */
export async function storedActivity(db: Database, activityId: string) {
  const [activity] = await db
    .select()
    .from(dormActivities)
    .where(eq(dormActivities.id, activityId));
  return activity;
}

/** The days off of an activity as kept, the earliest first. */
export async function daysOffOf(
  db: Database,
  activityId: string,
): Promise<string[]> {
  const kept = await db
    .select({ day: dormActivityDaysOff.day })
    .from(dormActivityDaysOff)
    .where(eq(dormActivityDaysOff.activityId, activityId))
    .orderBy(asc(dormActivityDaysOff.day));
  return kept.map(({ day }) => day);
}
