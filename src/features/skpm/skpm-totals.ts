import { and, count, eq, isNull, type SQL, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { Database } from "@/db/connect";
import { skpmRows, skpmUploads } from "@/db/schema";

const REPLACING = "replacing";
const replacing = alias(skpmUploads, REPLACING);

/** When the latest "Ganti semua data" that is not removed was saved. */
const LATEST_REPLACE = sql`(
  select max(${replacing.enteredAt})
  from ${skpmUploads} as ${sql.identifier(REPLACING)}
  where ${replacing.mode} = 'replace' and ${replacing.removedAt} is null
)`;

/**
 * An upload that counts: one not removed, and not saved before the latest
 * "Ganti semua data" that is not removed, whatever period it is from.
 */
export const IN_FORCE: SQL =
  and(
    isNull(skpmUploads.removedAt),
    sql`${skpmUploads.enteredAt} >= coalesce(${LATEST_REPLACE}, '-infinity'::timestamptz)`,
  ) ?? sql`false`;

/**
 * The total points and how many activities each student has by the
 * uploads in force, as a table to join students to. A student with no
 * row in force has no row here.
 */
export function totalsByStudent(db: Database) {
  return db
    .select({
      studentId: skpmRows.studentId,
      total: sql<number>`sum(${skpmRows.points})`.mapWith(Number).as("total"),
      activities: count().as("activities"),
    })
    .from(skpmRows)
    .innerJoin(
      skpmUploads,
      and(eq(skpmUploads.id, skpmRows.uploadId), IN_FORCE),
    )
    .groupBy(skpmRows.studentId)
    .as("skpm_totals");
}
