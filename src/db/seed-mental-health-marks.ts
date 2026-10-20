import { daysAfter } from "@/academic-periods/days-after";
import type { Database } from "./connect";
import type { SamplePeriod } from "./sample-data";
import { SAMPLE_MENTAL_HEALTH_MARKS } from "./sample-mental-health-marks";
import { mentalHealthMarkChanges, mentalHealthMarks } from "./schema";
import { noteResidents } from "./seed-health-notes";
import { momentOf, sampleAccountOf } from "./seed-siku-adjustments";

/**
 * Adds the sample mental health marks of dorm residents, each with the
 * log line of its setting, as the work of the sample BAM - Kesehatan or
 * Kepala Unit. The residents' kelompok pengasuhan must be there already.
 * `today` is today on campus.
 */
export async function addSampleMentalHealthMarks(
  db: Database,
  period: SamplePeriod,
  today: string,
  now: Date = new Date(),
): Promise<void> {
  const residents = await noteResidents(db, period);
  const writers = {
    bam_health: await sampleAccountOf(db, "bam_health"),
    head_of_unit: await sampleAccountOf(db, "head_of_unit"),
  };
  for (const mark of SAMPLE_MENTAL_HEALTH_MARKS) {
    const studentId = residents[mark.resident];
    if (studentId === undefined) {
      throw new Error("There are too few sample residents for the marks.");
    }
    const changedBy = writers[mark.savedAs];
    const changedAt = momentOf(daysAfter(today, -mark.daysAgo), now);
    const { category, observation } = mark;
    await db
      .insert(mentalHealthMarks)
      .values({ studentId, category, observation, changedBy, changedAt });
    await db.insert(mentalHealthMarkChanges).values({
      studentId,
      categoryBefore: null,
      observationBefore: "",
      categoryAfter: category,
      observationAfter: observation,
      changedBy,
      changedAt,
    });
  }
}
