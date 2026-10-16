import { daysAfter } from "@/academic-periods/days-after";
import type { Database } from "./connect";
import { SAMPLE_HEALTH_NOTES } from "./sample-health-notes";
import { healthNoteIllnesses, healthNotes } from "./schema";
import { studentIdsByNim } from "./seed-mentor-groups";
import { momentOf, sampleAccountOf } from "./seed-siku-adjustments";

function idOf(ids: Map<string, string>, nim: string): string {
  const id = ids.get(nim);
  if (id === undefined) {
    throw new Error(`A sample health note names the missing NIM ${nim}.`);
  }
  return id;
}

/**
 * Adds the sample health notes, oldest first, as the work of the sample
 * Penilai Mahasiswa or Kepala Unit. The sample students and accounts
 * must be there already. `today` is today on campus.
 */
export async function addSampleHealthNotes(
  db: Database,
  today: string,
  now: Date = new Date(),
): Promise<void> {
  const studentIds = await studentIdsByNim(db);
  const writers = {
    assessor: await sampleAccountOf(db, "assessor"),
    head_of_unit: await sampleAccountOf(db, "head_of_unit"),
  };
  for (const note of SAMPLE_HEALTH_NOTES) {
    const id = crypto.randomUUID();
    const examinedOn = daysAfter(today, -note.daysAgo);
    await db.insert(healthNotes).values({
      id,
      studentId: idOf(studentIds, note.nim),
      examinedOn,
      examiner: note.examiner,
      otherHistory: note.otherHistory,
      medicine: note.medicine,
      advice: note.advice,
      category: note.category,
      savedBy: writers[note.savedAs],
      savedAt: momentOf(examinedOn, now),
    });
    if (note.illnesses.length === 0) continue;
    await db
      .insert(healthNoteIllnesses)
      .values(note.illnesses.map((each) => ({ ...each, noteId: id })));
  }
}
