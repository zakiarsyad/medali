import { desc } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { academicPeriods } from "@/db/schema";
import type { AcademicPeriod } from "./academic-period";
import { campusDay } from "./campus-day";
import { runningPeriodOn } from "./running-period";

/** Every stored period, newest first. */
export async function readAcademicPeriods(
  db: Database,
): Promise<AcademicPeriod[]> {
  return db
    .select()
    .from(academicPeriods)
    .orderBy(desc(academicPeriods.startsOn));
}

/**
 * The period that runs on a day, today when none is given. Null only when
 * the day is before the first stored period.
 */
export async function readRunningPeriod(
  db: Database,
  day: string = campusDay(),
): Promise<AcademicPeriod | null> {
  return runningPeriodOn(await readAcademicPeriods(db), day);
}
