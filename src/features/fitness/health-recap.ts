import { and, type SQL, sql } from "drizzle-orm";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { healthRecapReadings } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { FitnessLimits } from "@/health-notes/fitness-ids";
import {
  readSickList,
  type SickList,
  type SickParts,
  sickParts,
} from "@/health-notes/sick-list";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import { dormCohortsOn } from "./health-subject";
import type { RecapParams } from "./recap-address";

/** The filter "Tempat tinggal". */
function residenceOf(parts: SickParts, params: RecapParams): SQL | undefined {
  if (params.residence === "dorm") return sql`${parts.dorm} is not null`;
  if (params.residence === "non_dorm") return sql`${parts.dorm} is null`;
  return undefined;
}

async function logReading(
  db: Database,
  actor: AccountForAccess,
  params: RecapParams,
  page: number,
): Promise<void> {
  await db.insert(healthRecapReadings).values({
    readBy: actor.id,
    readAt: WRITTEN_NOW,
    filters: {
      searched: params.query !== "",
      residence: params.residence,
      category: params.category,
      illness: params.illness,
      page,
    },
  });
}

/**
 * "Rekap data kesehatan seluruh mahasiswa", for an account with its
 * right, Kepala Unit alone: the four numbers of the Aktif students it
 * sees, dorm or not, and one page of those with an illness history, a
 * note with a category of its own, or Perlu tindak lanjut medis, that
 * match the search and filters; the most serious category first, then
 * by name. Each reading is logged, without a name, an illness or a
 * note's text. Null, with nothing read or logged, for any other account.
 */
export async function readHealthRecap(
  db: Database,
  actor: AccountForAccess,
  params: RecapParams,
  limits: FitnessLimits,
  today: string,
): Promise<SickList | null> {
  if (!may(actor.roles, "view_health_recap")) return null;
  const visible = visibleTo(rowLimitForAction(actor, "view_health_recap"));
  const parts = sickParts(db, limits, await dormCohortsOn(db, today));
  const seen = and(visible, ACTIVE_MEMBER);
  const recap = await readSickList(
    db,
    parts,
    seen,
    residenceOf(parts, params),
    params,
    limits,
  );
  await logReading(db, actor, params, recap.page);
  return recap;
}
