import { type SQL, sql } from "drizzle-orm";

const NO_DETAIL = sql<boolean>`false`;

/**
 * Whether the account may open the detail of the student a read is on,
 * from the students whose detail it may open, or null for none. Every
 * list that names students marks its links with this, so a link never
 * leads to "not found".
 */
export function opensDetailOf(detailVisible: SQL | null): SQL<boolean> {
  return detailVisible ? sql<boolean>`(${detailVisible})` : NO_DETAIL;
}
