import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { accounts } from "@/db/schema";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";

/** Made-up records for the checks of this area. */

export async function addTestActor(
  db: Database,
  name: string,
  roles: RoleId[],
  studentId: string | null = null,
): Promise<AccountForAccess> {
  const [account] = await db
    .insert(accounts)
    .values({ name, studentId })
    .returning();
  if (!account) throw new Error("The account was not added.");
  return { id: account.id, roles, studyProgramId: null, studentId };
}

export interface TestPeople {
  counsellor: AccountForAccess;
  /** Each student's own account, with the role Mahasiswa. */
  students: AccountForAccess[];
  studentIds: string[];
}

/**
 * A Konselor, and students of a program each with their own account.
 * `nims` are the NIMs of the file's own block; `program` is the file's
 * own program name.
 */
export async function addTestPeople(
  db: Database,
  program: string,
  nims: string[],
): Promise<TestPeople> {
  const programId = await addTestProgram(db, program);
  const counsellor = await addTestActor(db, "Konselor Uji", ["counsellor"]);
  const students: AccountForAccess[] = [];
  const studentIds: string[] = [];
  for (const [place, nim] of nims.entries()) {
    const name = `Mahasiswa Uji Konseling ${place + 1}`;
    const studentId = await addTestStudent(db, programId, { nim, name });
    studentIds.push(studentId);
    students.push(await addTestActor(db, name, ["student"], studentId));
  }
  return { counsellor, students, studentIds };
}
