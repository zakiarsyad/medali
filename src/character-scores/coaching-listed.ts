import { lt, or, type SQL, sql } from "drizzle-orm";
import { MEDALI_VALUES } from "@/ui/medali-values";
import { LISTED_BELOW_RERATA, LISTED_BELOW_SCORE } from "./coaching-need";
import type { latestAssessments } from "./latest-assessments";

type Latest = ReturnType<typeof latestAssessments>;

/**
 * The scores are whole, so a total below 390 is exactly a Rerata below
 * 65 to one decimal: 389 gives 64.8 and 390 gives 65.0.
 */
const LISTED_BELOW_TOTAL = LISTED_BELOW_RERATA * MEDALI_VALUES.length;

/**
 * The students whose latest assessment lists them for coaching, as the
 * database asks it, so a long list is counted and paged there. The same
 * rule as `coachingNeedOf`, which the checks confirm.
 */
export function listedForCoaching(latest: Latest): SQL | undefined {
  const lowest = sql`least(${latest.scoreM}, ${latest.scoreE}, ${latest.scoreD}, ${latest.scoreA}, ${latest.scoreL}, ${latest.scoreI})`;
  return or(
    lt(latest.total, LISTED_BELOW_TOTAL),
    sql`${lowest} < ${LISTED_BELOW_SCORE}`,
  );
}
