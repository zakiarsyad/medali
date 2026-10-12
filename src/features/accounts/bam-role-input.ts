import { isAccountId } from "@/auth/accounts";
import { type BamRole, isBamRole } from "@/auth/bam-roles";
import type { Parsed } from "@/parsed";

export interface BamRoleFields {
  accountId: string;
  roles: string[];
}

export interface BamRoleChange {
  /** The account of the student. */
  accountId: string;
  roles: BamRole[];
}

/** Checks the student picked and the roles ticked. Only BAM roles pass. */
export function parseBamRoles(fields: BamRoleFields): Parsed<BamRoleChange> {
  if (!isAccountId(fields.accountId)) {
    return { ok: false, error: "Pilih mahasiswa terlebih dahulu." };
  }
  if (fields.roles.length === 0) {
    return { ok: false, error: "Pilih minimal satu peran." };
  }
  const roles = fields.roles.filter(isBamRole);
  if (roles.length !== fields.roles.length) {
    return { ok: false, error: "Peran tidak dikenal." };
  }
  return {
    ok: true,
    value: { accountId: fields.accountId, roles: [...new Set(roles)] },
  };
}
