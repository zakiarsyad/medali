import { eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { accounts, students } from "@/db/schema";

export interface StudentAccount {
  id: string;
  name: string;
  /** Aktif, with neither the student nor the account removed. */
  isActive: boolean;
}

/**
 * Reads the account of a student and holds it until the transaction ends.
 * Every change to a student's BAM roles starts here, so two of them never
 * run at the same moment: the second waits and then sees what the first
 * one saved. Null for an account that is not a student's.
 */
export async function lockStudentAccount(
  tx: Database,
  accountId: string,
): Promise<StudentAccount | null> {
  const [found] = await tx
    .select({
      id: accounts.id,
      name: students.name,
      status: students.status,
      accountRemovedAt: accounts.deletedAt,
      studentRemovedAt: students.deletedAt,
    })
    .from(accounts)
    .innerJoin(students, eq(students.id, accounts.studentId))
    .where(eq(accounts.id, accountId))
    .for("update", { of: accounts });
  if (!found) return null;
  const isRemoved =
    found.accountRemovedAt !== null || found.studentRemovedAt !== null;
  return {
    id: found.id,
    name: found.name,
    isActive: found.status === "active" && !isRemoved,
  };
}
