import { eq } from "drizzle-orm";
import { may } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { addStudent } from "./add-student";
import type { StudentInput } from "./student-input";

/** The account that asks for a change, with the roles it holds now. */
export interface Actor {
  id: string;
  roles: readonly RoleId[];
}

export const NOT_ALLOWED = {
  ok: false,
  error: "Anda tidak berhak menginput data mahasiswa.",
} as const;

async function nimInUse(db: Database, nim: string): Promise<boolean> {
  const [found] = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.nim, nim))
    .limit(1);
  return found !== undefined;
}

/**
 * Adds a student through Pengguna baru mahasiswa, with their account. A
 * NIM stays taken after its student is removed, because the record is
 * kept.
 */
export async function inputStudent(
  db: Database,
  actor: Actor,
  student: StudentInput,
): Promise<Parsed<null>> {
  if (!may(actor.roles, "input_new_students")) return NOT_ALLOWED;
  if (await nimInUse(db, student.nim)) {
    return { ok: false, error: `NIM ${student.nim} sudah terdaftar.` };
  }
  await addStudent(
    db,
    {
      ...student,
      inputAt: new Date(),
      inputBy: actor.id,
      inputSource: "form",
    },
    actor.id,
  );
  return { ok: true, value: null };
}
