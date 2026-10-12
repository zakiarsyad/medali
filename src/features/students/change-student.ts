import { and, eq, isNull } from "drizzle-orm";
import { may } from "@/auth/access";
import { refusedWhenEmailInUse } from "@/auth/account-email";
import { rolesByAccount } from "@/auth/accounts";
import { endSessionsOf } from "@/auth/sessions";
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
 * Puts the name and the address on the account of a student. When the
 * address they sign in with is changed or taken away, their open
 * sign-ins end at once, so whoever signed in with the old address is
 * asked to sign in again.
 */
async function changeAccountOf(
  db: Database,
  studentId: string,
  name: string,
  email: string | null,
): Promise<void> {
  const [before] = await db
    .select({ id: accounts.id, email: accounts.email })
    .from(accounts)
    .where(eq(accounts.studentId, studentId));
  if (!before) throw new Error("A student put in here has no account.");
  await db
    .update(accounts)
    .set({ name, email })
    .where(eq(accounts.id, before.id));
  if (before.email === null || before.email === email) return;
  await endSessionsOf(db, before.id);
}

/**
 * Changes a student put in through Pengguna baru mahasiswa, found by NIM.
 * The NIM itself stays, and so does who put the student in, when and how.
 * The address goes on the student's account; one that another account
 * holds is refused, and nothing is changed.
 */
export async function changeStudent(
  db: Database,
  actor: Actor,
  student: StudentInput,
): Promise<Parsed<null>> {
  if (!may(actor.roles, "input_new_students")) return NOT_ALLOWED;
  const { nim, email, ...fields } = student;
  return refusedWhenEmailInUse(() =>
    db.transaction(async (tx) => {
      const [changed] = await tx
        .update(students)
        .set(fields)
        .where(and(eq(students.nim, nim), ADDED_HERE))
        .returning({ id: students.id });
      if (!changed) return NOT_FOUND;
      await changeAccountOf(tx, changed.id, fields.name, email);
      return { ok: true, value: null };
    }),
  );
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
    await removeAccountOf(tx, removed.id, actor.id, at);
    return { ok: true, value: removed.name };
  });
}
