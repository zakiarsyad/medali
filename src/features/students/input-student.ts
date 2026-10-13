import { may } from "@/auth/access";
import { refusedWhenEmailInUse } from "@/auth/account-email";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import type { Parsed } from "@/parsed";
import { addStudent, type NewStudent } from "./add-student";
import { holdFittingGroup } from "./fitting-group";
import { moveToGroup } from "./move-to-group";
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
 * `mentorGroupId` is the kelompok pengasuhan chosen for the student, or
 * null for none. The student and the place in the group are saved
 * together or not at all, and a group that does not fit is refused.
 */
export async function inputStudent(
  db: Database,
  actor: Actor,
  student: StudentInput,
  mentorGroupId: string | null = null,
): Promise<Parsed<null>> {
  if (!may(actor.roles, "input_new_students")) return NOT_ALLOWED;
  const newStudent: NewStudent = {
    ...student,
    inputAt: new Date(),
    inputBy: actor.id,
    inputSource: "form",
  };
  return refusedWhenEmailInUse(() =>
    db.transaction(async (tx) => {
      const fits = await holdFittingGroup(tx, mentorGroupId, student);
      if (!fits.ok) return fits;
      const added = await addStudent(tx, newStudent, actor.id);
      if (!added) {
        return { ok: false, error: `NIM ${student.nim} sudah terdaftar.` };
      }
      await moveToGroup(tx, added.studentId, mentorGroupId, actor.id);
      return { ok: true, value: null };
    }),
  );
}
