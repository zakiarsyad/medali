import { may } from "@/auth/access";
import { refusedWhenEmailInUse } from "@/auth/account-email";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import type { Parsed } from "@/parsed";
import { addStudent, type NewStudent } from "./add-student";
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

/**
 * Adds a student through Pengguna baru mahasiswa, with their account. A
 * NIM stays taken after its student is removed, because the record is
 * kept. An address another account holds is refused, and nobody is added.
 */
export async function inputStudent(
  db: Database,
  actor: Actor,
  student: StudentInput,
): Promise<Parsed<null>> {
  if (!may(actor.roles, "input_new_students")) return NOT_ALLOWED;
  const newStudent: NewStudent = {
    ...student,
    inputAt: new Date(),
    inputBy: actor.id,
    inputSource: "form",
  };
  return refusedWhenEmailInUse(async () => {
    const added = await addStudent(db, newStudent, actor.id);
    if (!added) {
      return { ok: false, error: `NIM ${student.nim} sudah terdaftar.` };
    }
    return { ok: true, value: null };
  });
}
