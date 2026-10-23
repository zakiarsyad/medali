import { type SQL, sql } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import type { Action } from "@/auth/roles";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { readDormCohorts } from "@/dorms/dorm-cohorts";
import { dormInSql } from "@/dorms/resident-condition";
import { readResidentPlaces } from "@/dorms/resident-rooms";
import type { FitnessLimits } from "@/health-notes/fitness-ids";
import { readFitnessLimits } from "@/health-notes/fitness-limits";
import { readFitnessByGroup } from "@/health-notes/fitness-recap-read";
import { roomWords } from "@/health-notes/health-words";
import { readNeedingCare, sickParts } from "@/health-notes/sick-list";
import {
  readMentalRecap,
  readPublished,
} from "@/mental-health/mental-recap-read";
import { countRecentSessions } from "@/mental-health/recent-sessions";
import { type SharedReader, sharedReachOf } from "@/mental-health/shared-reach";
import {
  type CareRow,
  careRowOf,
  type DormMental,
  type DormPhysical,
  type DormPublishedRow,
  dormMentalOf,
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
  mental: DormMental | null;
}

const NO_PANELS: DormHealthPanels = { physical: null, mental: null };

/** The Aktif residents among the students `reach` lets through. */
function residentsAmong(reach: SQL, dormCohorts: number[]): SQL {
  return sql`(${reach} and ${dormInSql(dormCohorts)} is not null)`;
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
 * Only the sharings named to a role that sees the panel, so a person who
 * is also Pengasuh gets no row of their mentees here. Null for an
 * account that may read none.
 */
function sharedReaderOf(account: AccountForAccess): SharedReader | null {
  const roles = account.roles.filter((role) =>
    may([role], "view_dorm_dashboard_mental"),
  );
  const reach = sharedReachOf({ ...account, roles });
  if (reach === null) return null;
  return { readerId: account.id, reach };
}

/**
 * The newest residents among `residents` whose data is published to the
 * account, each with their room, read on each load so one withdrawn
 * since is gone, and each written to the log of readings.
 */
async function readDormPublished(
  db: Database,
  account: AccountForAccess,
  residents: SQL,
  dormCohorts: number[],
  now: Date,
): Promise<DormPublishedRow[]> {
  const reader = sharedReaderOf(account);
  if (reader === null) return [];
  const { rows } = await readPublished(db, residents, reader, now);
  const ids = rows.map((row) => row.studentId);
  const places = await readResidentPlaces(db, ids, dormCohorts);
  return rows.map((row) => {
    const place = places.get(row.studentId);
    const room = roomWords(place?.dorm ?? null, place?.room ?? null);
    return { ...row, room };
  });
}

/**
 * The anonymous count of the residents `reach` lets through, by the
 * campus Dashboard's own count, how many sessions they had in the last
 * 30 days, and those of them whose data is published to the account.
 */
async function readMentalPanel(
  db: Database,
  account: AccountForAccess,
  reach: SQL,
  dormCohorts: number[],
  now: Date,
): Promise<DormMental> {
  const residents = residentsAmong(reach, dormCohorts);
  const [recap, sessions, published] = await Promise.all([
    readMentalRecap(db, residents),
    countRecentSessions(db, residents, campusDay(now)),
    readDormPublished(db, account, residents, dormCohorts, now),
  ]);
  return { ...dormMentalOf(recap, sessions), published };
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
  const mentalReach = reachOf(account, "view_dorm_dashboard_mental");
  if (physicalReach === null && mentalReach === null) return NO_PANELS;
  const dormCohorts = (await readDormCohorts(db, campusDay(now))) ?? [];
  const [physical, mental] = await Promise.all([
    physicalReach === null
      ? null
      : readPhysicalPanel(db, account, physicalReach, dormCohorts),
    mentalReach === null
      ? null
      : readMentalPanel(db, account, mentalReach, dormCohorts, now),
  ]);
  return { physical, mental };
}
