import { desc } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import type { Database } from "@/db/connect";
import { mentalHealthScreenings } from "@/db/schema";

/**
 * Each screened student's latest screening, the newest date then the
 * newest save, as a table to join: its level, instrument and date, and
 * only the `more` columns a caller asks for. A recipient's read asks for
 * none, so the scores, the "Risiko" mark and the note are never read.
 */
export function latestScreenings<More extends Record<string, PgColumn>>(
  db: Database,
  more: More,
) {
  const kept = mentalHealthScreenings;
  return db
    .selectDistinctOn([kept.studentId], {
      studentId: kept.studentId,
      instrument: kept.instrument,
      screenedOn: kept.screenedOn,
      level: kept.level,
      ...more,
    })
    .from(kept)
    .orderBy(kept.studentId, desc(kept.screenedOn), desc(kept.savedAt))
    .as("latest");
}
