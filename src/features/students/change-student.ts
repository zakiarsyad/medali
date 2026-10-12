import { and, eq, isNull } from "drizzle-orm";
import { may } from "@/auth/access";
import { rolesByAccount } from "@/auth/accounts";
import { endCompanionDuty, settleCompanionDuty } from "@/db/companion-duty";
import type { Database } from "@/db/connect";
import { accounts, roleChanges, students } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { ADDED_HERE } from "./added-students";
import { type Actor, NOT_ALLOWED } from "./input-student";
import type { StudentInput } from "./student-input";

export const NOT_FOUND = {
  ok: false,
  error: "Mahasiswa tidak ditemukan.",
} as const;

/**
 * Changes a student put in through Pengguna baru mahasiswa, found by NIM.
 * The NIM itself stays, and so does who put the student in, when and how.
 * A kakak pendamping whose changed data no longer fits the duty stops
 * being one: no longer active, living in a dorm now, or not of the jenis
 * kelamin of the dorm they serve.
 */
export async function changeStudent(
  db: Database,
  actor: Actor,
  student: StudentInput,
): Promise<Parsed<null>> {
  if (!may(actor.roles, "input_new_students")) return NOT_ALLOWED;
  const { nim, ...fields } = student;
  return db.transaction(async (tx) => {
    const [changed] = await tx
      .update(students)
      .set(fields)
      .where(and(eq(students.nim, nim), ADDED_HERE))
      .returning({ id: students.id });
    if (!changed) return NOT_FOUND;
    await settleCompanionDuty(tx, changed.id);
    await tx
      .update(accounts)
      .set({ name: fields.name })
      .where(eq(accounts.studentId, changed.id));
    return { ok: true, value: null };
  });
}

async function removeAccountOf(
  db: Database,
  studentId: string,
  by: string,
  at: Date,
): Promise<void> {
  const [account] = await db
    .update(accounts)
    .set({ deletedAt: at, deletedBy: by })
    .where(and(eq(accounts.studentId, studentId), isNull(accounts.deletedAt)))
    .returning({ id: accounts.id });
  if (!account) return;
  const roles = await rolesByAccount(db, [account.id]);
  await db.insert(roleChanges).values({
    accountId: account.id,
    changedBy: by,
    action: "removed",
    rolesBefore: roles.get(account.id) ?? [],
    rolesAfter: [],
  });
}

/**
 * Marks a student put in through Pengguna baru mahasiswa as removed, and
 * their account with them. Nothing is erased. Gives the student's name.
 * A removed student stops being kakak pendamping.
 */
export async function removeStudent(
  db: Database,
  actor: Actor,
  nim: string,
): Promise<Parsed<string>> {
  if (!may(actor.roles, "input_new_students")) return NOT_ALLOWED;
  return db.transaction(async (tx) => {
    const at = new Date();
    const [removed] = await tx
      .update(students)
      .set({ deletedAt: at, deletedBy: actor.id })
      .where(and(eq(students.nim, nim), ADDED_HERE))
      .returning({ id: students.id, name: students.name });
    if (!removed) return NOT_FOUND;
    await endCompanionDuty(tx, removed.id);
    await removeAccountOf(tx, removed.id, actor.id, at);
    return { ok: true, value: removed.name };
  });
}
