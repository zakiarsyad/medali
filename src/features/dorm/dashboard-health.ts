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
import { readNeedingCare, sickParts } from "@/health-notes/sick-list";
import {
  type CareRow,
  careRowOf,
  type DormPhysical,
  dormPhysicalOf,
} from "./dashboard-health-recap";
import { residentsIn } from "./dorm-health";

/** How many residents "Perlu perhatian dan tindak lanjut medis" shows at most. */
export const CARE_SHOWN = 8;

/** "Kesehatan jasmani penghuni", with the limits that give each category its scores. */
export interface PhysicalPanel extends DormPhysical {
  limits: FitnessLimits;
  /** The residents who need care, heaviest first; null for an account without the right to names. */
  care: CareRow[] | null;
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

/**
 * The residents in Perlu perhatian or Perlu tindak lanjut medis that the
 * list of Kesehatan holds, among those the right to names lets the
 * account see; null, with nothing read, for an account without it.
 */
async function readCare(
  db: Database,
  account: AccountForAccess,
  limits: FitnessLimits,
  dormCohorts: number[],
): Promise<CareRow[] | null> {
  const action = "view_dorm_dashboard_physical_names";
  if (!may(account.roles, action)) return null;
  const parts = sickParts(db, limits, dormCohorts);
  const seen = residentsIn(parts, rowLimitForAction(account, action));
  const rows = await readNeedingCare(db, parts, seen, limits, CARE_SHOWN);
  return rows.map(careRowOf);
}

async function readPhysicalPanel(
  db: Database,
  account: AccountForAccess,
  reach: SQL,
  dormCohorts: number[],
): Promise<PhysicalPanel> {
  const { limits } = await readFitnessLimits(db);
  const [tallies, care] = await Promise.all([
    readFitnessByGroup(db, limits, reach, dormInSql(dormCohorts)),
    readCare(db, account, limits, dormCohorts),
  ]);
  return { ...dormPhysicalOf(tallies), limits, care };
}

/**
 * The health panels of Dashboard asrama for an account at a moment, each
 * counted over the Aktif residents of the dorms that its own right lets
 * the account see: Ketua Program Studi their own program only. A panel
 * or a list of names the account has no right to is not read at all.
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
    physical: await readPhysicalPanel(db, account, physicalReach, dormCohorts),
  };
}
