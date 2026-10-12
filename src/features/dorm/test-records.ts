import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { accounts, students, studyPrograms } from "@/db/schema";

/** Made-up records for the checks of this area. */

/** The period the checks run in: angkatan 2026 is in semester 1. */
export const ODD_2026 = {
  startYear: 2026,
  term: "odd",
  startsOn: "2026-08-01",
  endsOn: "2027-01-31",
} as const;

/** A day in that period. */
export const DAY = "2026-10-12";

export interface TestActor {
  id: string;
  roles: RoleId[];
}

export async function addTestActor(
  db: Database,
  name: string,
  roles: RoleId[],
): Promise<TestActor> {
  const [account] = await db.insert(accounts).values({ name }).returning();
  if (!account) throw new Error("The account was not added.");
  return { id: account.id, roles };
}

export async function addTestProgram(
  db: Database,
  name: string,
): Promise<number> {
  const [program] = await db.insert(studyPrograms).values({ name }).returning();
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
