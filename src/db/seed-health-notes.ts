import { and, asc, eq, isNull } from "drizzle-orm";
import { daysAfter } from "@/academic-periods/days-after";
import { menteesOf } from "@/mentoring/mentees-of";
import type { Database } from "./connect";
import type { SamplePeriod } from "./sample-data";
import {
  SAMPLE_DORM_HEALTH_NOTES,
  SAMPLE_HEALTH_NOTES,
  type SampleHealthNote,
} from "./sample-health-notes";
import { sampleGroupHolders } from "./sample-mentor-groups";
import { accounts, healthNoteIllnesses, healthNotes, students } from "./schema";
import { sampleResidents } from "./seed-dorm-counts";
import { studentIdsByNim } from "./seed-mentor-groups";
import { momentOf, sampleAccountOf } from "./seed-siku-adjustments";

type NoteContent = Omit<SampleHealthNote, "nim" | "savedAs">;

function idOf(ids: Map<string, string>, nim: string): string {
  const id = ids.get(nim);
  if (id === undefined) {
    throw new Error(`A sample health note names the missing NIM ${nim}.`);
  }
  return id;
}

/** Adds one sample note with its illnesses, saved on its Tanggal. */
async function addNote(
  db: Database,
  studentId: string,
  note: NoteContent,
  savedBy: string,
  today: string,
  now: Date,
): Promise<void> {
  const id = crypto.randomUUID();
  const examinedOn = daysAfter(today, -note.daysAgo);
  await db.insert(healthNotes).values({
    id,
    studentId,
    examinedOn,
    examiner: note.examiner,
    otherHistory: note.otherHistory,
    medicine: note.medicine,
    advice: note.advice,
    category: note.category,
    savedBy,
    savedAt: momentOf(examinedOn, now),
  });
  if (note.illnesses.length === 0) return;
  await db
    .insert(healthNoteIllnesses)
    .values(note.illnesses.map((each) => ({ ...each, noteId: id })));
}

/**
 * Adds the sample health notes of students who live in no dorm, oldest
 * first, as the work of the sample Penilai Mahasiswa or Kepala Unit. The
 * sample students and accounts must be there already. `today` is today
 * on campus.
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
    const { nim, savedAs, ...content } = note;
    const studentId = idOf(studentIds, nim);
    await addNote(db, studentId, content, writers[savedAs], today, now);
  }
}

/** The account of the sample Pengasuh who holds a group of residents. */
async function samplePengasuh(db: Database): Promise<string> {
  const [name] = sampleGroupHolders();
  if (name === undefined) throw new Error("There is no sample Pengasuh.");
  const [found] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.name, name), isNull(accounts.studentId)));
  if (!found) throw new Error(`The sample Pengasuh ${name} is missing.`);
  return found.id;
}

/** How many of the sample Pengasuh's mentees the sample dorm notes are of. */
const NOTED_MENTEES = 2;

/**
 * The residents of the running period that the sample dorm notes are
 * spread over: two of the sample Pengasuh's mentees first, then the
 * residents outside that Pengasuh's groups, each by name.
 */
export async function noteResidents(
  db: Database,
  period: SamplePeriod,
): Promise<string[]> {
  const residents = (await sampleResidents(db, period)).map((each) => each.id);
  const mentees = await db
    .select({ id: students.id })
    .from(students)
    .where(menteesOf([await samplePengasuh(db)]))
    .orderBy(asc(students.name));
  const menteeIds = mentees.map((each) => each.id);
  const isResident = (id: string) => residents.includes(id);
  const residentMentees = menteeIds.filter(isResident);
  const others = residents.filter((id) => !menteeIds.includes(id));
  return [...residentMentees.slice(0, NOTED_MENTEES), ...others];
}

/**
 * Adds the sample health notes of dorm residents, oldest first, as the
 * work of the sample BAM - Kesehatan or Kepala Unit. The residents'
 * kelompok pengasuhan must be there already. `today` is today on campus.
 */
export async function addSampleDormHealthNotes(
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
  for (const note of SAMPLE_DORM_HEALTH_NOTES) {
    const { resident, savedAs, ...content } = note;
    const studentId = residents[resident];
    if (studentId === undefined) {
      throw new Error("There are too few sample residents for the notes.");
    }
    await addNote(db, studentId, content, writers[savedAs], today, now);
  }
}
