import { and, asc, isNotNull, ne } from "drizzle-orm";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { accounts } from "@/db/schema";
import { mentorsVisibleTo } from "./visible-mentors";

/**
 * The units of the mentors an account may see, by name, so the filter
 * offers no unit that holds no mentor.
 */
export async function listMentorUnits(
  db: Database,
  limit: RowLimit,
): Promise<string[]> {
  const rows = await db
    .selectDistinct({ unit: accounts.unit })
    .from(accounts)
    .where(
      and(
        mentorsVisibleTo(limit),
        isNotNull(accounts.unit),
        ne(accounts.unit, ""),
      ),
    )
    .orderBy(asc(accounts.unit));
  const units: string[] = [];
  for (const row of rows) {
    if (row.unit !== null) units.push(row.unit);
  }
  return units;
}
