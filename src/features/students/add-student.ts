import type { Database } from "@/db/connect";
import { accountRoles, accounts, roleChanges, students } from "@/db/schema";

export type NewStudent = Omit<typeof students.$inferInsert, "id" | "createdAt">;

export interface AddedStudent {
  studentId: string;
  accountId: string;
}

/**
 * Keeps student records, and gives each student their own account. The
 * student role given is logged as the work of the account `by`. A student
 * whose NIM is already used is left out and gets nothing: the database
 * decides that, so two people adding the same NIM at once cannot both
 * succeed. Gives the students that were added.
 *
 * Every student is added whole or not at all, in four requests to the
 * database however many students there are.
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
      .values(newStudents)
      .onConflictDoNothing({ target: students.nim })
      .returning({ id: students.id, name: students.name });
    if (records.length === 0) return [];

    const added = await tx
      .insert(accounts)
      .values(records.map(({ id, name }) => ({ name, studentId: id })))
      .returning({ accountId: accounts.id, studentId: accounts.studentId });
    if (added.length !== records.length) {
      throw new Error("Not every student account was added.");
    }

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
    return added.map(({ accountId, studentId }) => {
      if (!studentId) throw new Error("A student account has no student.");
      return { accountId, studentId };
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
