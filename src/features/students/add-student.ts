import type { Database } from "@/db/connect";
import { accountRoles, accounts, roleChanges, students } from "@/db/schema";

export type NewStudent = Omit<typeof students.$inferInsert, "id" | "createdAt">;

export interface AddedStudent {
  studentId: string;
  accountId: string;
}

/**
 * Keeps a student record, and gives the student their own account. The
 * student role given is logged as the work of the account `by`. Adds
 * nothing and gives null when the NIM is already used: the database
 * decides that, so two people adding the same NIM at once cannot both
 * succeed.
 */
export async function addStudent(
  db: Database,
  student: NewStudent,
  by: string,
): Promise<AddedStudent | null> {
  return db.transaction(async (tx) => {
    const [record] = await tx
      .insert(students)
      .values(student)
      .onConflictDoNothing({ target: students.nim })
      .returning({ id: students.id });
    if (!record) return null;

    const [account] = await tx
      .insert(accounts)
      .values({ name: student.name, studentId: record.id })
      .returning({ id: accounts.id });
    if (!account) throw new Error("The student account was not added.");

    await tx
      .insert(accountRoles)
      .values({ accountId: account.id, role: "student" });
    await tx.insert(roleChanges).values({
      accountId: account.id,
      changedBy: by,
      action: "added",
      rolesBefore: [],
      rolesAfter: ["student"],
    });
    return { studentId: record.id, accountId: account.id };
  });
}
