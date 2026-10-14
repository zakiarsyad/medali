import type { SQL } from "drizzle-orm";
import type { Database } from "@/db/connect";
import type { ActivitiesParams } from "./activities-address";
import type { ResidentsByDorm } from "./activity-audience";
import { listOneOffs, listRoutines, type OneOffPage } from "./activity-lists";
import type { ActivityRow } from "./activity-row";
import { readDailyActivities } from "./daily-activities";
import { countResidentsByDorm } from "./resident-counts";

/** What the list that is open shows. Only that list is read. */
export type ActivitiesView =
  | {
      view: "harian";
      day: string;
      activities: ActivityRow[];
      /** The residents of each dorm the account may see, for Peserta. */
      residents: ResidentsByDorm;
    }
  | { view: "rutin"; routines: ActivityRow[] }
  | { view: "nonrutin"; list: OneOffPage };

/**
 * Reads the list the address asks for: one day of Jadwal harian, every
 * repeating activity, or one page of the one-off ones. `visible` is the
 * students the account may see; the Peserta are counted among them.
 */
export async function loadActivitiesView(
  db: Database,
  params: ActivitiesParams,
  visible: SQL,
): Promise<ActivitiesView> {
  if (params.view === "rutin") {
    return { view: "rutin", routines: await listRoutines(db) };
  }
  if (params.view === "nonrutin") {
    return { view: "nonrutin", list: await listOneOffs(db, params.page) };
  }
  const [activities, residents] = await Promise.all([
    readDailyActivities(db, params.day),
    countResidentsByDorm(db, visible),
  ]);
  return { view: "harian", day: params.day, activities, residents };
}
