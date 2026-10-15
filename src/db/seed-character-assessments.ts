import { daysAfter } from "@/academic-periods/days-after";
import { runningPeriodOn } from "@/academic-periods/running-period";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import type { Database } from "./connect";
import { SAMPLE_ASSESSMENTS } from "./sample-character-assessments";
import { characterAssessments } from "./schema";
import { studentIdsByNim } from "./seed-mentor-groups";
import { momentOf, sampleAccountOf } from "./seed-siku-adjustments";

function idOf(ids: Map<string, string>, nim: string): string {
  const id = ids.get(nim);
  if (id === undefined) {
    throw new Error(`A sample assessment names the missing NIM ${nim}.`);
  }
  return id;
}

/**
 * Adds the sample character assessments, each in the academic period
 * that ran on its day, as the work of the sample Penilai Mahasiswa or
 * Kepala Unit. The sample students, accounts and periods must be there
 * already. `today` is today on campus.
 */
export async function addSampleCharacterAssessments(
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
  for (const sample of SAMPLE_ASSESSMENTS) {
    const day = daysAfter(today, -sample.daysAgo);
    const period = runningPeriodOn(periods, day);
    if (!period) throw new Error("A sample assessment is before every period.");
    const [scoreM, scoreE, scoreD, scoreA, scoreL, scoreI] = sample.scores;
    await db.insert(characterAssessments).values({
      id: crypto.randomUUID(),
      studentId: idOf(studentIds, sample.nim),
      scoreM,
      scoreE,
      scoreD,
      scoreA,
      scoreL,
      scoreI,
      source: sample.source,
      note: sample.note,
      periodId: period.id,
      enteredBy: enterers[sample.enteredAs],
      enteredAt: momentOf(day, now),
    });
  }
}
