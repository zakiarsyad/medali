import type { SQL } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import type { Action } from "@/auth/roles";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { readDormCohorts } from "@/dorms/dorm-cohorts";
import { dormInSql } from "@/dorms/resident-condition";
import type { FitnessLimits } from "@/health-notes/fitness-ids";
import { readFitnessLimits } from "@/health-notes/fitness-limits";
import { readFitnessByGroup } from "@/health-notes/fitness-recap-read";
import { type DormPhysical, dormPhysicalOf } from "./dashboard-health-recap";

/** "Kesehatan jasmani penghuni", with the limits that give each category its scores. */
export interface PhysicalPanel extends DormPhysical {
  limits: FitnessLimits;
}

/** The health panels of Dashboard asrama; null for a panel the account may not see. */
export interface DormHealthPanels {
  physical: PhysicalPanel | null;
}

/**
 * The students an account reaches through an action, only by the roles
 * that allow it; null, so nothing is read, for an account without it.
 */
function reachOf(account: AccountForAccess, action: Action): SQL | null {
  if (!may(account.roles, action)) return null;
  return visibleTo(rowLimitForAction(account, action));
}

async function readPhysicalPanel(
  db: Database,
  reach: SQL,
  dormCohorts: number[],
): Promise<PhysicalPanel> {
  const { limits } = await readFitnessLimits(db);
  const tallies = await readFitnessByGroup(
    db,
    limits,
    reach,
    dormInSql(dormCohorts),
  );
  return { ...dormPhysicalOf(tallies), limits };
}

/**
 * The health panels of Dashboard asrama for an account at a moment, each
 * counted over the Aktif residents of the dorms that its own right lets
 * the account see: Ketua Program Studi their own program only. A panel
 * the account has no right to is not read at all.
 */
export async function loadDormHealth(
  db: Database,
  account: AccountForAccess,
  now: Date,
): Promise<DormHealthPanels> {
  const physicalReach = reachOf(account, "view_dorm_dashboard_physical");
  if (physicalReach === null) return { physical: null };
  const dormCohorts = (await readDormCohorts(db, campusDay(now))) ?? [];
  return {
    physical: await readPhysicalPanel(db, physicalReach, dormCohorts),
  };
}
