import type { Database } from "@/db/connect";
import { accountRoles, accounts, students, studyPrograms } from "@/db/schema";
import type { RoleId } from "./role-ids";

/** Made-up records for the checks of sign-in. */

interface TestAccount {
  email: string;
  roles?: RoleId[];
  deletedAt?: Date;
}

export async function addTestAccount(
  db: Database,
  { email, roles = ["mentor"], deletedAt }: TestAccount,
): Promise<string> {
  const [account] = await db
    .insert(accounts)
    .values({ name: "Akun Uji", email, deletedAt })
    .returning();
  if (!account) throw new Error("The account was not added.");
  await db
    .insert(accountRoles)
    .values(roles.map((role) => ({ accountId: account.id, role })));
  return account.id;
}

/**
 * A made-up student with their account, as Pengguna baru mahasiswa makes
 * one. `email` is the address on the account, or null for none.
 */
export async function addTestStudentAccount(
  db: Database,
  { nim, email }: { nim: string; email: string | null },
): Promise<string> {
  const programName = `Prodi Uji ${nim}`;
  const [program] = await db
    .insert(studyPrograms)
    .values({ name: programName, code: programName })
    .returning();
  if (!program) throw new Error("The study program was not added.");
  const [student] = await db
    .insert(students)
    .values({
      nim,
      name: "Mahasiswa Uji",
      studyProgramId: program.id,
      entryPath: "regular",
      sex: "female",
      cohortYear: 2026,
    })
    .returning();
  if (!student) throw new Error("The student was not added.");
  const [account] = await db
    .insert(accounts)
    .values({ name: student.name, studentId: student.id, email })
    .returning();
  if (!account) throw new Error("The account was not added.");
  await db
    .insert(accountRoles)
    .values({ accountId: account.id, role: "student" });
  return account.id;
}
