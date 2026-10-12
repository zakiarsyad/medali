import type { Database } from "@/db/connect";
import {
  accountRoles,
  accounts,
  emailChanges,
  roleChanges,
  students,
} from "@/db/schema";
import { emailChangeOf } from "./email-change";

type StudentRecord = Omit<typeof students.$inferInsert, "id" | "createdAt">;

export interface NewStudent extends StudentRecord {
  /**
   * The campus address the student's account is to hold, already checked
   * and in small letters. Without one the student cannot sign in yet.
   */
  email?: string | null;
}

export interface AddedStudent {
  studentId: string;
  accountId: string;
  nim: string;
}

function recordOf({ email: _onTheAccount, ...record }: NewStudent) {
  return record satisfies StudentRecord;
}

function emailsByNim(newStudents: NewStudent[]): Map<string, string | null> {
  return new Map(newStudents.map(({ nim, email }) => [nim, email ?? null]));
}

/** Writes the address each new account came with to the address change log. */
async function logAddedEmails(
  db: Database,
  added: { accountId: string; email: string | null }[],
  by: string,
): Promise<void> {
  const lines = added.flatMap(({ accountId, email }) => {
    const change = emailChangeOf(null, email);
    return change ? [{ accountId, changedBy: by, ...change }] : [];
  });
  if (lines.length === 0) return;
  await db.insert(emailChanges).values(lines);
}

/**
 * Keeps student records, and gives each student their own account. The
 * student role given is logged as the work of the account `by`. A student
 * whose NIM is already used is left out and gets nothing: the database
 * decides that, so two people adding the same NIM at once cannot both
 * succeed. Gives the students that were added.
 *
 * An address goes on the student's account. The database keeps one
 * address to one active account: when another account holds one of them
 * the write fails, and nobody is added. Each address is logged as added,
 * as the work of the account `by`.
 *
 * Every student is added whole or not at all, in at most five requests
 * to the database however many students there are.
 */
export async function addStudents(
  db: Database,
  newStudents: NewStudent[],
  by: string,
): Promise<AddedStudent[]> {
  if (newStudents.length === 0) return [];
  return db.transaction(async (tx) => {
    const records = await tx
      .insert(students)
      .values(newStudents.map(recordOf))
      .onConflictDoNothing({ target: students.nim })
      .returning({ id: students.id, name: students.name, nim: students.nim });
    if (records.length === 0) return [];

    const emails = emailsByNim(newStudents);
    const added = await tx
      .insert(accounts)
      .values(
        records.map(({ id, name, nim }) => ({
          name,
          studentId: id,
          email: emails.get(nim) ?? null,
        })),
      )
      .returning({
        accountId: accounts.id,
        studentId: accounts.studentId,
        email: accounts.email,
      });
    if (added.length !== records.length) {
      throw new Error("Not every student account was added.");
    }
    await logAddedEmails(tx, added, by);

    await tx
      .insert(accountRoles)
      .values(
        added.map(({ accountId }) => ({ accountId, role: "student" as const })),
      );
    await tx.insert(roleChanges).values(
      added.map(({ accountId }) => ({
        accountId,
        changedBy: by,
        action: "added" as const,
        rolesBefore: [],
        rolesAfter: ["student" as const],
      })),
    );
    const nims = new Map(records.map(({ id, nim }) => [id, nim]));
    return added.map(({ accountId, studentId }) => {
      const nim = studentId ? nims.get(studentId) : undefined;
      if (!studentId || !nim) {
        throw new Error("A student account has no student.");
      }
      return { accountId, studentId, nim };
    });
  });
}

/** Adds one student with their account, or gives null when the NIM is used. */
export async function addStudent(
  db: Database,
  student: NewStudent,
  by: string,
): Promise<AddedStudent | null> {
  const [added] = await addStudents(db, [student], by);
  return added ?? null;
}
