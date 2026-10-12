import type { Database } from "@/db/connect";
import {
  dormRoomPlaces,
  dormRooms,
  students,
  studyPrograms,
} from "@/db/schema";

/** Made-up records for the checks of the dorms, here and in the dorm area. */

/** The period the checks run in: angkatan 2026 is in semester 1. */
export const ODD_2026 = {
  startYear: 2026,
  term: "odd",
  startsOn: "2026-08-01",
  endsOn: "2027-01-31",
} as const;

/** A day in that period. */
export const DAY = "2026-10-12";

export async function addTestProgram(
  db: Database,
  name: string,
): Promise<number> {
  const [program] = await db
    .insert(studyPrograms)
    .values({ name, code: name })
    .returning();
  if (!program) throw new Error("The study program was not added.");
  return program.id;
}

type TestStudent = Pick<typeof students.$inferInsert, "nim" | "name"> &
  Partial<typeof students.$inferInsert>;

/** A Reguler woman of angkatan 2026, unless told otherwise. */
export async function addTestStudent(
  db: Database,
  studyProgramId: number,
  student: TestStudent,
): Promise<string> {
  const [added] = await db
    .insert(students)
    .values({
      studyProgramId,
      entryPath: "regular",
      sex: "female",
      cohortYear: 2026,
      ...student,
    })
    .returning({ id: students.id });
  if (!added) throw new Error("The student was not added.");
  return added.id;
}

type TestRoom = Pick<typeof dormRooms.$inferInsert, "number"> &
  Partial<typeof dormRooms.$inferInsert>;

/**
 * A room of Dana Rakca on floor 1 for 4 people, unless told otherwise.
 * Each file of checks uses room numbers, NIMs and program names of its
 * own: the database makes two checks that add the same one wait for each
 * other.
 */
export async function addTestRoom(
  db: Database,
  room: TestRoom,
): Promise<string> {
  const [added] = await db
    .insert(dormRooms)
    .values({
      dorm: "dana_rakca",
      floor: 1,
      capacity: 4,
      ...room,
    })
    .returning({ id: dormRooms.id });
  if (!added) throw new Error("The room was not added.");
  return added.id;
}

export async function placeTestResident(
  db: Database,
  roomId: string,
  studentId: string,
): Promise<void> {
  await db.insert(dormRoomPlaces).values({ roomId, studentId });
}
