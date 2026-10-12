import { may } from "@/auth/access";
import type { Database } from "@/db/connect";
import type { Parsed } from "@/parsed";
import type { BamRoleChange } from "./bam-role-input";
import { NOT_ACTIVE } from "./give-bam-roles";
import {
  type Manager,
  NOT_ALLOWED,
  rolesOf,
  saveBamRoles,
} from "./save-bam-roles";
import { lockStudentAccount } from "./student-account";

/**
 * Replaces the BAM roles of an Aktif student. Their other roles stay. At
 * least one BAM role is kept: taking all away is `removeBamRoles`. Gives
 * the student's name.
 */
export async function changeBamRoles(
  db: Database,
  manager: Manager,
  change: BamRoleChange,
): Promise<Parsed<string>> {
  if (!may(manager.roles, "manage_users")) return NOT_ALLOWED;
  if (change.roles.length === 0) {
    return { ok: false, error: "Pilih minimal satu peran." };
  }
  return db.transaction(async (tx) => {
    const student = await lockStudentAccount(tx, change.accountId);
    if (!student?.isActive) return NOT_ACTIVE;
    const before = await rolesOf(tx, student.id);
    await saveBamRoles(tx, student.id, before, change.roles, manager.id);
    return { ok: true, value: student.name };
  });
}

/**
 * Takes every BAM role of a student away, also from one who is no longer
 * Aktif or was removed. The student and their role Mahasiswa stay. Gives
 * the student's name.
 */
export async function removeBamRoles(
  db: Database,
  manager: Manager,
  accountId: string,
): Promise<Parsed<string>> {
  if (!may(manager.roles, "manage_users")) return NOT_ALLOWED;
  return db.transaction(async (tx) => {
    const student = await lockStudentAccount(tx, accountId);
    if (!student) return { ok: false, error: "Mahasiswa tidak ditemukan." };
    const before = await rolesOf(tx, student.id);
    await saveBamRoles(tx, student.id, before, [], manager.id);
    return { ok: true, value: student.name };
  });
}
