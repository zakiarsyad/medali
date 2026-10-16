import { and, type SQL, sql } from "drizzle-orm";
import {
  type AccountForAccess,
  may,
  type RowLimit,
  rowLimitForAction,
} from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { readDormCohorts } from "@/dorms/dorm-cohorts";
import type { FitnessLimits } from "@/health-notes/fitness-ids";
import {
  readSickList,
  type SickList,
  type SickParts,
  sickParts,
} from "@/health-notes/sick-list";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import type { DormHealthParams } from "./dorm-health-address";

/** The list "Mahasiswa asrama yang sakit", with whose residents it holds. */
export interface DormHealthList {
  list: SickList;
  /** The row limit the list was read with, which its numbers' hint names. */
  reach: RowLimit;
}

/** The parts of a read of residents on a day: none live in the dorm while no period runs. */
export async function residentParts(
  db: Database,
  limits: FitnessLimits,
  today: string,
): Promise<SickParts> {
  const cohorts = (await readDormCohorts(db, today)) ?? [];
  return sickParts(db, limits, cohorts);
}

/** The Aktif residents a row limit lets through. */
export function residentsIn(
  parts: SickParts,
  reach: RowLimit,
): SQL | undefined {
  return and(visibleTo(reach), ACTIVE_MEMBER, sql`${parts.dorm} is not null`);
}

function dormOf(parts: SickParts, params: DormHealthParams): SQL | undefined {
  if (params.dorm === "all") return undefined;
  return sql`${parts.dorm} = ${params.dorm}`;
}

/**
 * "Mahasiswa asrama yang sakit", for an account with the right to read
 * it: the four numbers of the Aktif residents it may see by that right,
 * Pengasuh their own mentees only, and one page of those with an illness
 * history, a note with a category of its own, or Perlu tindak lanjut
 * medis, that match the search and the filters. Null, with nothing read,
 * for any other account.
 */
export async function readDormHealthList(
  db: Database,
  actor: AccountForAccess,
  params: DormHealthParams,
  limits: FitnessLimits,
  today: string,
): Promise<DormHealthList | null> {
  if (!may(actor.roles, "view_dorm_health_notes")) return null;
  const reach = rowLimitForAction(actor, "view_dorm_health_notes");
  const parts = await residentParts(db, limits, today);
  const list = await readSickList(
    db,
    parts,
    residentsIn(parts, reach),
    dormOf(parts, params),
    params,
    limits,
  );
  return { list, reach };
}
