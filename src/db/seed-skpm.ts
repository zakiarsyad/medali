import { createHash } from "node:crypto";
import { daysAfter } from "@/academic-periods/days-after";
import { runningPeriodOn } from "@/academic-periods/running-period";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import type { Database } from "./connect";
import { SAMPLE_SKPM_UPLOADS, type SampleSkpmUpload } from "./sample-skpm";
import { skpmRows, skpmUploadChanges, skpmUploads } from "./schema";
import { studentIdsByNim } from "./seed-mentor-groups";
import { momentOf, sampleAccountOf } from "./seed-siku-adjustments";

function idOf(ids: Map<string, string>, nim: string): string {
  const id = ids.get(nim);
  if (id === undefined) {
    throw new Error(`A sample SKPM row names the missing NIM ${nim}.`);
  }
  return id;
}

/** A made-up fingerprint: a sample upload had no real file. */
function sampleFingerprint(sample: SampleSkpmUpload): string {
  return createHash("sha256").update(sample.fileName).digest("hex");
}

function dayOf(today: string, daysAgo: number | null): string | null {
  return daysAgo === null ? null : daysAfter(today, -daysAgo);
}

async function addLogLines(
  db: Database,
  uploadId: string,
  by: string,
  enteredAt: Date,
  removedAt: Date | null,
): Promise<void> {
  await db
    .insert(skpmUploadChanges)
    .values({
      uploadId,
      changedBy: by,
      changedAt: enteredAt,
      action: "uploaded",
    });
  if (removedAt === null) return;
  await db
    .insert(skpmUploadChanges)
    .values({
      uploadId,
      changedBy: by,
      changedAt: removedAt,
      action: "removed",
    });
}

/**
 * Adds the sample SKPM uploads with their rows, each in the academic
 * period that ran on its day, as the work of the sample Penilai
 * Mahasiswa or Kepala Unit, with their log lines. The sample students,
 * accounts and periods must be there already. `today` is today on
 * campus. "Poin untuk nilai 100" is left at its starting number.
 */
export async function addSampleSkpm(
  db: Database,
  today: string,
  now: Date = new Date(),
): Promise<void> {
  const studentIds = await studentIdsByNim(db);
  const periods = await readAcademicPeriods(db);
  const enterers = {
    assessor: await sampleAccountOf(db, "assessor"),
    head_of_unit: await sampleAccountOf(db, "head_of_unit"),
  };
  for (const sample of SAMPLE_SKPM_UPLOADS) {
    const day = daysAfter(today, -sample.daysAgo);
    const period = runningPeriodOn(periods, day);
    if (!period)
      throw new Error("A sample SKPM upload is before every period.");
    const by = enterers[sample.enteredAs];
    const enteredAt = momentOf(day, now);
    const removedDay = dayOf(today, sample.removedDaysAgo);
    const removedAt = removedDay === null ? null : momentOf(removedDay, now);
    const nims = new Set(sample.rows.map((each) => each.nim));
    const id = crypto.randomUUID();
    await db.insert(skpmUploads).values({
      id,
      fileName: sample.fileName,
      fingerprint: sampleFingerprint(sample),
      mode: sample.mode,
      periodId: period.id,
      rowCount: sample.rows.length,
      studentCount: nims.size,
      enteredBy: by,
      enteredAt,
      removedBy: removedAt === null ? null : by,
      removedAt,
    });
    await db.insert(skpmRows).values(
      sample.rows.map((each, place) => ({
        uploadId: id,
        line: place + 2,
        studentId: idOf(studentIds, each.nim),
        activity: each.activity,
        category: each.category,
        level: each.level,
        activityRole: each.activityRole,
        day: dayOf(today, each.daysAgo),
        points: each.points,
      })),
    );
    await addLogLines(db, id, by, enteredAt, removedAt);
  }
}
