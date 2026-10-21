import { eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { accounts, stageBreakdowns } from "@/db/schema";
import type { ValueKey } from "@/ui/medali-values";
import type { Change } from "./change";
import { savedVersion } from "./saved-version";
import {
  stageBreakdown,
  type ValueBreakdown,
  type VersionedBreakdown,
} from "./stage-breakdown";
import { TAHAP } from "./stages";

export interface ShownBreakdown {
  tahapNo: number;
  values: ValueBreakdown[];
  /** The last change of the tahap, or null while all is starting content. */
  changed: Change | null;
}

/** The breakdown of each tahap as it is now, with who changed it last. */
export async function readStageBreakdowns(
  db: Database,
): Promise<ShownBreakdown[]> {
  const rows = await db
    .select({
      tahap: stageBreakdowns.tahap,
      key: stageBreakdowns.valueKey,
      text: stageBreakdowns.text,
      activities: stageBreakdowns.activities,
      indicatorCodes: stageBreakdowns.indicatorCodes,
      at: stageBreakdowns.changedAt,
      by: accounts.name,
    })
    .from(stageBreakdowns)
    .innerJoin(accounts, eq(accounts.id, stageBreakdowns.changedBy));

  return TAHAP.map(({ no }) => {
    const saved = new Map<ValueKey, VersionedBreakdown>();
    let changed: Change | null = null;
    for (const { tahap, key, at, by, ...content } of rows) {
      if (tahap !== no) continue;
      saved.set(key, { ...content, version: savedVersion(at) });
      if (!changed || at > changed.at) changed = { at, by };
    }
    return { tahapNo: no, values: stageBreakdown(no, saved), changed };
  });
}
