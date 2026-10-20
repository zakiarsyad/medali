import { daysAfter } from "@/academic-periods/days-after";
import type { Database } from "./connect";
import { SAMPLE_SCREENINGS } from "./sample-mental-health-screenings";
import { mentalHealthScreeningLog, mentalHealthScreenings } from "./schema";
import { counsellorId, studentOf } from "./seed-counselling-consents";
import { momentOf } from "./seed-siku-adjustments";

/**
 * Adds the sample mental health screenings, each with the log line of
 * its save, as the work of the sample Konselor. The sample students and
 * accounts must be there already. `today` is today on campus.
 */
export async function addSampleMentalHealthScreenings(
  db: Database,
  today: string,
  now: Date = new Date(),
): Promise<void> {
  const by = await counsellorId(db);
  for (const sample of SAMPLE_SCREENINGS) {
    const { nim, daysAgo, ...result } = sample;
    const student = await studentOf(db, nim);
    const screenedOn = daysAfter(today, -daysAgo);
    const at = momentOf(screenedOn, now);
    await db.insert(mentalHealthScreenings).values({
      ...result,
      studentId: student.id,
      screenedOn,
      savedBy: by,
      savedAt: at,
    });
    await db
      .insert(mentalHealthScreeningLog)
      .values({ studentId: student.id, event: "saved", by, at });
  }
}
