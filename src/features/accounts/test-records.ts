import { asc, eq } from "drizzle-orm";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  accountRoles,
  accounts,
  roleChanges,
  students,
  studyPrograms,
} from "@/db/schema";
import type { Manager } from "./save-bam-roles";

/** Made-up records for the checks of this area. */

export async function addTestManager(
  db: Database,
  roles: RoleId[] = ["head_of_unit"],
): Promise<Manager> {
  const [account] = await db
    .insert(accounts)
    .values({ name: "Pengelola Uji" })
    .returning();
  if (!account) throw new Error("The account was not added.");
  await db
    .insert(accountRoles)
    .values(roles.map((role) => ({ accountId: account.id, role })));
  return { id: account.id, roles };
}

/**
 * Each file of checks uses a program name and NIMs of its own: the
 * database makes two checks that add the same one wait for each other.
 */
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

export type TestStudent = Pick<typeof students.$inferInsert, "nim" | "name"> &
  Partial<typeof students.$inferInsert>;

/** An Aktif student with their account, unless told otherwise. */
export async function addTestStudentAccount(
  db: Database,
  studyProgramId: number,
  student: TestStudent,
  roles: RoleId[] = ["student"],
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
  const [account] = await db
    .insert(accounts)
    .values({ name: student.name, studentId: added.id })
    .returning({ id: accounts.id });
  if (!account) throw new Error("The account was not added.");
  await db
    .insert(accountRoles)
    .values(roles.map((role) => ({ accountId: account.id, role })));
  return account.id;
}

/** The lines of the log of role changes for one account, oldest first. */
export async function roleLogOf(db: Database, accountId: string) {
  return db
    .select()
    .from(roleChanges)
    .where(eq(roleChanges.accountId, accountId))
    .orderBy(asc(roleChanges.changedAt));
}
