import { desc, eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { accounts, fitnessCategoryLimits } from "@/db/schema";
import {
  type FitnessLimits,
  STARTING_LIMITS,
  STARTING_VERSION,
} from "./fitness-ids";

/** "Ambang skor" as it is now, with who set it last and when. */
export interface LimitsInForce {
  limits: FitnessLimits;
  /** What a form opened on these limits carries, to find a save made since. */
  version: string;
  /** The last setting, or null while the limits are the starting ones. */
  set: { at: Date; by: string } | null;
}

/** The latest setting, with the account behind it. */
export interface LatestLimits extends LimitsInForce {
  set: { at: Date; by: string };
  setById: string;
  replaces: string | null;
}

/** The setting in force, or null while none has been saved. */
export async function readLatestLimits(
  db: Database,
): Promise<LatestLimits | null> {
  const [latest] = await db
    .select({ row: fitnessCategoryLimits, by: accounts.name })
    .from(fitnessCategoryLimits)
    .innerJoin(accounts, eq(accounts.id, fitnessCategoryLimits.setBy))
    .orderBy(desc(fitnessCategoryLimits.setAt), desc(fitnessCategoryLimits.id))
    .limit(1);
  if (!latest) return null;
  const { row, by } = latest;
  return {
    limits: {
      excellentFrom: row.excellentFrom,
      goodFrom: row.goodFrom,
      attentionFrom: row.attentionFrom,
    },
    version: row.id,
    set: { at: row.setAt, by },
    setById: row.setBy,
    replaces: row.replaces,
  };
}

/** The limits in force, or the starting ones while none have been saved. */
export async function readFitnessLimits(db: Database): Promise<LimitsInForce> {
  const latest = await readLatestLimits(db);
  if (!latest) {
    return { limits: STARTING_LIMITS, version: STARTING_VERSION, set: null };
  }
  const { limits, version, set } = latest;
  return { limits, version, set };
}
