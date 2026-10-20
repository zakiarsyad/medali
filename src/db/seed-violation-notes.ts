import { daysAfter } from "@/academic-periods/days-after";
import type { Database } from "./connect";
import type { SamplePeriod } from "./sample-data";
import {
  SAMPLE_VIOLATION_NOTES,
  type SampleViolationNote,
} from "./sample-violation-notes";
import { violationNoteChanges, violationNotes } from "./schema";
import { studentOf } from "./seed-counselling-consents";
import { momentOf, sampleAccountOf } from "./seed-siku-adjustments";

/** The Tanggal of a sample note, by today at the latest. */
function sampleNoteDay(
  note: SampleViolationNote,
  periods: SamplePeriod[],
  today: string,
): string {
  const period = periods[note.semester];
  if (!period) throw new Error("There is no sample period for a note.");
  if (note.semester === 1) return daysAfter(period.startsOn, note.days);
  const day = daysAfter(today, -note.days);
  return day < period.startsOn ? period.startsOn : day;
}

/**
 * Adds the sample violation notes, each with the log line of its save,
 * as the work of the sample Pembina Disiplin Mahasiswa or Kepala Unit.
 * The sample students, accounts and periods, newest first, must be there
 * already. `today` is today on campus.
 */
export async function addSampleViolationNotes(
  db: Database,
  periods: SamplePeriod[],
  today: string,
  now: Date = new Date(),
): Promise<void> {
  const writers = {
    discipline_officer: await sampleAccountOf(db, "discipline_officer"),
    head_of_unit: await sampleAccountOf(db, "head_of_unit"),
  };
  for (const note of SAMPLE_VIOLATION_NOTES) {
    const student = await studentOf(db, note.nim);
    const day = sampleNoteDay(note, periods, today);
    const savedBy = writers[note.savedAs];
    const savedAt = momentOf(day, now);
    const id = crypto.randomUUID();
    const { description, punishment, otherPunishment, remark } = note;
    await db.insert(violationNotes).values({
      id,
      studentId: student.id,
      day,
      description,
      punishment,
      otherPunishment,
      remark,
      savedBy,
      savedAt,
    });
    await db.insert(violationNoteChanges).values({
      noteId: id,
      changedBy: savedBy,
      changedAt: savedAt,
      action: "added",
    });
  }
}
