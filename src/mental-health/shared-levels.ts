import { and, arrayContains, eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { counsellingSharings, students } from "@/db/schema";
import { latestScreenings } from "./latest-screenings";

/**
 * The latest screening of a sharing's student, joined only when the
 * sharing holds the level, so a level left out is never read.
 */
export function sharedLevels(db: Database) {
  const latest = latestScreenings(db, {});
  const joined = and(
    eq(latest.studentId, students.id),
    arrayContains(counsellingSharings.data, ["level"]),
  );
  return { latest, joined };
}
