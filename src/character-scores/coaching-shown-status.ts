import { ne, sql } from "drizzle-orm";
import { coachingStatuses } from "@/db/schema";
import { type CoachingStatus, FIRST_COACHING_STATUS } from "./coaching-status";

/**
 * The status a listed student shows, for a read of students joined with
 * their saved status: the one saved, or Teridentifikasi.
 */
export const SHOWN_STATUS = sql<CoachingStatus>`coalesce(${coachingStatuses.status}, ${sql.raw(`'${FIRST_COACHING_STATUS}'`)})`;

/** A listed student whose coaching is not yet Selesai. */
export const NOT_DONE = ne(SHOWN_STATUS, "done");
