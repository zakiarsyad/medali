import { sql } from "drizzle-orm";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { mentoringIndicatorSets } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import {
  type ScoreIndicator,
  STARTING_INDICATORS,
} from "@/mentoring/score-indicators";
import type { Parsed } from "@/parsed";
import { parseIndicators } from "./indicator-input";
import { type LatestIndicators, readLatestIndicators } from "./indicator-set";
import {
  INDICATOR_SET_LOCK,
  STARTING_INDICATORS_VERSION,
} from "./indicator-version";

export const NOT_ALLOWED_TO_SET_INDICATORS = {
  ok: false,
  error:
    "Indikator penilaian hanya dapat diubah oleh Kepala Unit Pembangunan Karakter.",
} as const;

/** What a form opened on a version that is no setting of the indicators is told. */
export const INDICATORS_CHANGED = {
  ok: false,
  error: "Indikator sudah diubah. Muat ulang.",
} as const;

/** What "Simpan indikator" says once the indicators are saved. */
export const INDICATORS_SAVED_MESSAGE = "Indikator penilaian disimpan.";

const SAVED = { ok: true, value: null } as const;

/** What a form opened before someone else saved the indicators is told. */
export function indicatorsChangedBy(name: string): Parsed<null> {
  return {
    ok: false,
    error: `Indikator sudah diubah oleh ${name}. Muat ulang.`,
  };
}

function isSameSet(
  one: readonly ScoreIndicator[],
  other: readonly ScoreIndicator[],
): boolean {
  if (one.length !== other.length) return false;
  return one.every(
    (indicator, place) =>
      indicator.name === other[place]?.name &&
      indicator.sentence === other[place]?.sentence,
  );
}

/** The setting a form opened on `version` replaces: null for the starting indicators. */
function replacedBy(version: string): string | null {
  return version === STARTING_INDICATORS_VERSION ? null : version;
}

/**
 * Whether the setting in force is this very save, sent again: the same
 * indicators by the same account from the same form, as a second press
 * does.
 */
function isRepeat(
  latest: LatestIndicators,
  actor: AccountForAccess,
  indicators: readonly ScoreIndicator[],
  version: string,
): boolean {
  if (latest.replaces !== replacedBy(version)) return false;
  if (latest.setById !== actor.id) return false;
  return isSameSet(latest.indicators, indicators);
}

async function save(
  tx: Database,
  actor: AccountForAccess,
  indicators: ScoreIndicator[],
  version: string,
): Promise<Parsed<null>> {
  // Two saves at once would both find the same indicators in force; the
  // second waits here for the first, so it sees the first and is refused.
  // The setting in force is the latest by time, so the time comes from
  // the database clock once the wait is over.
  await tx.execute(
    sql`select pg_advisory_xact_lock(hashtext(${INDICATOR_SET_LOCK}))`,
  );
  const latest = await readLatestIndicators(tx);
  const inForce = latest?.version ?? STARTING_INDICATORS_VERSION;
  if (version !== inForce) {
    if (latest === null) return INDICATORS_CHANGED;
    if (isRepeat(latest, actor, indicators, version)) return SAVED;
    return indicatorsChangedBy(latest.set.by);
  }
  await tx.insert(mentoringIndicatorSets).values({
    indicators,
    before: [...(latest?.indicators ?? STARTING_INDICATORS)],
    replaces: latest?.version ?? null,
    setBy: actor.id,
    setAt: WRITTEN_NOW,
  });
  return SAVED;
}

/**
 * "Simpan indikator": sets the six indicators of the mentoring score, as
 * a line of its own with the indicators before it, who set them and
 * when. Scores given already keep the names they were given with; new
 * ones take these. `version` is the indicators the form was opened on.
 * Refused for a role without the right to set them, for indicators that
 * do not pass their checks, and for a form opened before someone else
 * saved, saving nothing. The same form sent twice saves once.
 */
export async function saveIndicators(
  db: Database,
  actor: AccountForAccess,
  sent: readonly ScoreIndicator[],
  version: string,
): Promise<Parsed<null>> {
  if (!may(actor.roles, "set_mentoring_indicators")) {
    return NOT_ALLOWED_TO_SET_INDICATORS;
  }
  const parsed = parseIndicators(sent);
  if (!parsed.ok) return parsed;
  return db.transaction((tx) => save(tx, actor, parsed.value, version));
}
