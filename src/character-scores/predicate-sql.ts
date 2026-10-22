import { type SQL, type SQLWrapper, sql } from "drizzle-orm";
import { MEDALI_VALUES } from "@/ui/medali-values";
import {
  BRONZE_FROM,
  GOLD_FROM,
  type Predicate,
  SILVER_FROM,
} from "./assessment-score";

/**
 * The lowest total of six whole scores whose Rerata, to one decimal,
 * reaches `rerata`: 509 gives 84.8 and 510 gives 85.0, so no total is on
 * the other side of a boundary from its Rerata.
 */
function lowestTotal(rerata: number): number {
  return rerata * MEDALI_VALUES.length;
}

/**
 * The predikat of the total of six scores, as the database asks it, so a
 * long list is filtered and paged there. The same rule as `predicateOf`,
 * which the checks confirm.
 */
export function predicateSql(total: SQLWrapper): SQL<Predicate> {
  return sql<Predicate>`(case when ${total} >= ${lowestTotal(GOLD_FROM)}::integer then ${"gold"} when ${total} >= ${lowestTotal(SILVER_FROM)}::integer then ${"silver"} when ${total} >= ${lowestTotal(BRONZE_FROM)}::integer then ${"bronze"} else ${"guidance"} end)`;
}
