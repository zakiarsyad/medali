import { and, eq, isNull } from "drizzle-orm";
import { may } from "@/auth/access";
import { refusedWhenEmailInUse } from "@/auth/account-email";
import { rolesByAccount } from "@/auth/accounts";
import { endSessionsOf } from "@/auth/sessions";
import { endCompanionDuty, settleCompanionDuty } from "@/db/companion-duty";
import type { Database } from "@/db/connect";
import { accounts, emailChanges, roleChanges, students } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { ADDED_HERE } from "./added-students";
import type { ChangeSent } from "./change-sent";
import { emailChangeOf } from "./email-change";
import { holdFittingGroup } from "./fitting-group";
import { type Actor, NOT_ALLOWED } from "./input-student";
import { moveToGroup } from "./move-to-group";
import type { StudentInput } from "./student-input";

export const NOT_FOUND = {
  ok: false,
  error: "Mahasiswa tidak ditemukan.",
} as const;

/** What a change made from an older record is told. */
export const STUDENT_CHANGED = {
  ok: false,
  error:
    "Data mahasiswa ini sudah diubah orang lain. Muat ulang halaman, lalu ulangi perubahan Anda.",
} as const;

/**
 * Holds the record of a student put in here until the save ends, so two
 * changes of one student never run at the same moment: the second waits,
 * and then reads the version the first one left.
 */
async function holdStudent(tx: Database, nim: string) {
  const [stored] = await tx
    .select({ id: students.id, version: students.version })
    .from(students)
    .where(and(eq(students.nim, nim), ADDED_HERE))
    .for("update");
  return stored;
}

/**
 * Puts the name and the address on the account of a student. A change
 * of the address is logged as the work of the account `by`. When the
 * address they sign in with is changed or taken away, their open
 * sign-ins end at once, so whoever signed in with the old address is
 * asked to sign in again.
 */
async function changeAccountOf(
  db: Database,
  studentId: string,
  name: string,
  email: string | null,
  by: string,
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
  const change = emailChangeOf(before.email, email);
  if (!change) return;
  await db
    .insert(emailChanges)
    .values({ accountId: before.id, changedBy: by, ...change });
  if (change.action === "added") return;
  await endSessionsOf(db, before.id);
}

/**
 * Changes a student put in through Pengguna baru mahasiswa, found by NIM.
 * The NIM itself stays, and so does who put the student in, when and how.
 * The address goes on the student's account; one that another account
 * holds is refused, and nothing is changed.
 * A kakak pendamping whose changed data no longer fits the duty stops
 * being one: no longer active, living in a dorm now, or not of the jenis
 * kelamin of the dorm they serve.
 * The student leaves the group they were in for the one chosen, or for
 * none, in the same save, and the move is logged. A group that does not
 * fit the data being saved is refused, and nothing is changed.
 * A change sent from an older version of the record is refused too: every
 * change that is saved raises the version by one.
 */
export async function changeStudent(
  db: Database,
  actor: Actor,
  student: StudentInput,
  sent: ChangeSent,
): Promise<Parsed<null>> {
  if (!may(actor.roles, "input_new_students")) return NOT_ALLOWED;
  const { nim, email, ...fields } = student;
  return refusedWhenEmailInUse(() =>
    db.transaction(async (tx) => {
      const stored = await holdStudent(tx, nim);
      if (!stored) return NOT_FOUND;
      if (stored.version !== sent.version) return STUDENT_CHANGED;
      const fits = await holdFittingGroup(tx, sent.mentorGroupId, student);
      if (!fits.ok) return fits;
      await tx
        .update(students)
        .set({ ...fields, version: stored.version + 1 })
        .where(eq(students.id, stored.id));
      await settleCompanionDuty(tx, stored.id);
      await changeAccountOf(tx, stored.id, fields.name, email, actor.id);
      await moveToGroup(tx, stored.id, sent.mentorGroupId, actor.id);
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
 * A removed student stops being kakak pendamping, and leaves their
 * kelompok pengasuhan for good; the log keeps which group they left.
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
    await moveToGroup(tx, removed.id, null, actor.id);
    return { ok: true, value: removed.name };
  });
}
