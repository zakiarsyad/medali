import type { Database } from "@/db/connect";
import { accountRoles, accounts, roleChanges, students } from "@/db/schema";

export type NewStudent = Omit<typeof students.$inferInsert, "id" | "createdAt">;

export interface AddedStudent {
  studentId: string;
  accountId: string;
}

/**
 * Keeps a student record, and gives the student their own account. The
 * student role given is logged as the work of the account `by`.
 */
export async function addStudent(
  db: Database,
  student: NewStudent,
  by: string,
): Promise<AddedStudent> {
  return db.transaction(async (tx) => {
    const [record] = await tx
      .insert(students)
      .values(student)
      .returning({ id: students.id });
    if (!record) throw new Error("The student record was not kept.");

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
