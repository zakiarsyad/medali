import { asc, count, type SQL, type SQLWrapper, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";

/** How many students a list of members holds in all, on every page. */
export interface MemberCounts {
  /** Every member the list shows: the Aktif ones and those on Cuti. */
  listed: number;
  /** The Aktif members, who count in the size of a group. */
  counted: number;
  /** How many kelas akademik the Aktif members are spread over. */
  classes: number;
}

const IS_COUNTED = sql`${students.status} = 'active'`;

/** Counted over the students `listed` names, not over a page of them. */
export async function readMemberCounts(
  db: Database,
  listed: SQL,
): Promise<MemberCounts> {
  const [counts] = await db
    .select({
      listed: count(),
      counted: sql<number>`count(*) filter (where ${IS_COUNTED})`.mapWith(
        Number,
      ),
      classes:
        sql<number>`count(distinct ${students.className}) filter (where ${IS_COUNTED} and ${students.className} <> '')`.mapWith(
          Number,
        ),
    })
    .from(students)
    .where(listed);
  return counts ?? { listed: 0, counted: 0, classes: 0 };
}

/**
 * The order the members table shows: the lowest Rerata first and those
 * not assessed last, then by name. `total` is the total of each student's
 * latest scores, whose order is that of their Rerata. The id last keeps
 * two pages from sharing a row.
 */
export function lowestRerataOrder(total: SQLWrapper): SQL[] {
  return [
    sql`${total} asc nulls last`,
    asc(students.name),
    asc(students.nim),
    asc(students.id),
  ];
}
