import { may } from "@/auth/access";
import { isBamRole } from "@/auth/bam-roles";
import type { Database } from "@/db/connect";
import type { Parsed } from "@/parsed";
import type { BamRoleChange } from "./bam-role-input";
import {
  type Manager,
  NOT_ALLOWED,
  rolesOf,
  saveBamRoles,
} from "./save-bam-roles";
import { lockStudentAccount } from "./student-account";

export const NOT_ACTIVE = {
  ok: false,
  error: "Mahasiswa tidak ditemukan atau tidak aktif. Pilih mahasiswa lain.",
} as const;

/**
 * Gives an Aktif student BAM roles, beside the roles they hold. Giving
 * the same roles again changes nothing. Gives the student's name.
 */
export async function giveBamRoles(
  db: Database,
  manager: Manager,
  change: BamRoleChange,
): Promise<Parsed<string>> {
  if (!may(manager.roles, "manage_users")) return NOT_ALLOWED;
  return db.transaction(async (tx) => {
    const student = await lockStudentAccount(tx, change.accountId);
    if (!student?.isActive) return NOT_ACTIVE;
    const before = await rolesOf(tx, student.id);
    const held = before.filter(isBamRole);
    const wanted = [...new Set([...held, ...change.roles])];
    await saveBamRoles(tx, student.id, before, wanted, manager.id);
    return { ok: true, value: student.name };
  });
}
