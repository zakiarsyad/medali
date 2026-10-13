import { randomUUID } from "node:crypto";
import type { Database } from "./connect";
import {
  type SampleMentoringNote,
  sampleMentoringNotes,
} from "./sample-mentoring-notes";
import type { SampleStudent } from "./sample-students";
import { mentoringNotes } from "./schema";
import {
  type AddedGroup,
  mentorIdsByName,
  studentIdsByNim,
} from "./seed-mentor-groups";

type NewNote = typeof mentoringNotes.$inferInsert;

function idOf(ids: Map<string, string>, key: string, what: string): string {
  const id = ids.get(key);
  if (id === undefined) {
    throw new Error(`A sample mentoring note names a ${what} that is missing.`);
  }
  return id;
}

/** The moment a sample note was saved: the noon of its day, or now. */
function writtenAt(happenedOn: string, now: Date): Date {
  const noon = new Date(`${happenedOn}T12:00:00+07:00`);
  return noon < now ? noon : now;
}

/**
 * Adds the sample notes of the sample groups, each as the work of the
 * sample Pengasuh who held the group on its day. The groups with their
 * members and mentors must be there already. `day` is today on campus.
 */
export async function addSampleMentoringNotes(
  db: Database,
  groups: AddedGroup[],
  students: SampleStudent[],
  day: string,
): Promise<void> {
  const samples = groups.map((group) => group.sample);
  const notes = sampleMentoringNotes(samples, students, day);
  if (notes.length === 0) return;
  const studentIds = await studentIdsByNim(db);
  const mentorIds = await mentorIdsByName(db, samples);
  const now = new Date();

  function newNote(sample: SampleMentoringNote): NewNote {
    const { nim, writer, ...words } = sample;
    return {
      ...words,
      id: randomUUID(),
      studentId: idOf(studentIds, nim, "student"),
      writtenBy: idOf(mentorIds, writer, "Pengasuh"),
      writtenAt: writtenAt(sample.happenedOn, now),
    };
  }

  await db.insert(mentoringNotes).values(notes.map(newNote));
}
