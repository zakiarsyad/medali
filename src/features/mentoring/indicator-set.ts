import { desc, eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { accounts, mentoringIndicatorSets } from "@/db/schema";
import {
  type ScoreIndicator,
  STARTING_INDICATORS,
} from "@/mentoring/score-indicators";

/** The version of a form opened while the starting indicators are in force. */
export const STARTING_INDICATORS_VERSION = "start";

/** The indicators as they are now, with who set them last and when. */
export interface IndicatorsInForce {
  indicators: readonly ScoreIndicator[];
  /** What a form opened on these indicators carries, to find a save made since. */
  version: string;
  /** The last setting, or null while the indicators are the starting ones. */
  set: { at: Date; by: string } | null;
}

/** The latest setting, with the account behind it. */
export interface LatestIndicators extends IndicatorsInForce {
  set: { at: Date; by: string };
  setById: string;
  replaces: string | null;
}

/** The setting in force, or null while none has been saved. */
export async function readLatestIndicators(
  db: Database,
): Promise<LatestIndicators | null> {
  const [latest] = await db
    .select({ row: mentoringIndicatorSets, by: accounts.name })
    .from(mentoringIndicatorSets)
    .innerJoin(accounts, eq(accounts.id, mentoringIndicatorSets.setBy))
    .orderBy(
      desc(mentoringIndicatorSets.setAt),
      desc(mentoringIndicatorSets.id),
    )
    .limit(1);
  if (!latest) return null;
  const { row, by } = latest;
  return {
    indicators: row.indicators,
    version: row.id,
    set: { at: row.setAt, by },
    setById: row.setBy,
    replaces: row.replaces,
  };
}

/** The indicators in force, or the starting ones while none has been saved. */
export async function readIndicators(db: Database): Promise<IndicatorsInForce> {
  const latest = await readLatestIndicators(db);
  if (!latest) {
    return {
      indicators: STARTING_INDICATORS,
      version: STARTING_INDICATORS_VERSION,
      set: null,
    };
  }
  const { indicators, version, set } = latest;
  return { indicators, version, set };
}
