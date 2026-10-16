import { sql } from "drizzle-orm";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { fitnessCategoryLimits } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import {
  type FitnessLimits,
  LIMIT_KEYS,
  STARTING_LIMITS,
  STARTING_VERSION,
} from "@/health-notes/fitness-ids";
import {
  type LatestLimits,
  readLatestLimits,
} from "@/health-notes/fitness-limits";
import type { Parsed } from "@/parsed";
import { parseLimits, type SentLimits } from "./fitness-input";

export const NOT_ALLOWED_TO_SET_LIMITS = {
  ok: false,
  error:
    "Ambang skor hanya dapat diubah oleh Kepala Unit Pembangunan Karakter.",
} as const;

/** What a form opened on a version that is no setting of the limits is told. */
export const LIMITS_CHANGED_SINCE = {
  ok: false,
  error: "Ambang sudah diubah. Muat ulang.",
} as const;

/** What "Simpan ambang" says once the limits are saved. */
export const LIMITS_SAVED_MESSAGE = "Ambang kategori disimpan.";

const SAVED = { ok: true, value: null } as const;

/** What a form opened before someone else saved the limits is told. */
export function limitsChangedBy(name: string): Parsed<null> {
  return { ok: false, error: `Ambang sudah diubah oleh ${name}. Muat ulang.` };
}

function isSameLimits(one: FitnessLimits, other: FitnessLimits): boolean {
  return LIMIT_KEYS.every((key) => one[key] === other[key]);
}

/** The setting a form opened on `version` replaces: null for the starting limits. */
function replacedBy(version: string): string | null {
  return version === STARTING_VERSION ? null : version;
}

/**
 * Whether the setting in force is this very save, sent again: the same
 * limits by the same account from the same form, as a second press does.
 */
function isRepeat(
  latest: LatestLimits,
  actor: AccountForAccess,
  limits: FitnessLimits,
  version: string,
): boolean {
  if (latest.replaces !== replacedBy(version)) return false;
  if (latest.setById !== actor.id) return false;
  return isSameLimits(latest.limits, limits);
}

async function save(
  tx: Database,
  actor: AccountForAccess,
  limits: FitnessLimits,
  version: string,
): Promise<Parsed<null>> {
  // Two saves at once would both find the same limits in force; the
  // second waits here for the first, so it sees the first and is
  // refused. The setting in force is the latest by time, so the time
  // comes from the database clock once the wait is over.
  await tx.execute(
    sql`select pg_advisory_xact_lock(hashtext('fitness_category_limits'))`,
  );
  const latest = await readLatestLimits(tx);
  const inForce = latest?.version ?? STARTING_VERSION;
  if (version !== inForce) {
    if (latest === null) return LIMITS_CHANGED_SINCE;
    if (isRepeat(latest, actor, limits, version)) return SAVED;
    return limitsChangedBy(latest.set.by);
  }
  await tx.insert(fitnessCategoryLimits).values({
    ...limits,
    before: latest?.limits ?? STARTING_LIMITS,
    replaces: latest?.version ?? null,
    setBy: actor.id,
    setAt: WRITTEN_NOW,
  });
  return SAVED;
}

/**
 * "Simpan ambang": sets the limits of the fitness categories, which puts
 * every student's latest score in its category again, as a line of its
 * own with the limits before it, who set them and when. `version` is
 * the limits the form was opened on. Refused for a role without the
 * right "Bobot penilaian", for limits that do not pass their checks, and
 * for a form opened before someone else saved, saving nothing. The same
 * form sent twice saves once.
 */
export async function saveFitnessLimits(
  db: Database,
  actor: AccountForAccess,
  sent: SentLimits,
  version: string,
): Promise<Parsed<null>> {
  if (!may(actor.roles, "set_grade_weights")) return NOT_ALLOWED_TO_SET_LIMITS;
  const parsed = parseLimits(sent);
  if (!parsed.ok) return parsed;
  return db.transaction((tx) => save(tx, actor, parsed.value, version));
}
