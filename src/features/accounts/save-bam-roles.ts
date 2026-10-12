import { and, eq, inArray } from "drizzle-orm";
import { rolesByAccount } from "@/auth/accounts";
import { BAM_ROLES, type BamRole, isBamRole } from "@/auth/bam-roles";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { accountRoles, roleChanges } from "@/db/schema";
import { inRoleOrder, sameRoles } from "./manage-accounts";

/** Who sends a change: the server checks their roles on every change. */
export interface Manager {
  id: string;
  roles: readonly RoleId[];
}

/** What a change to BAM roles answers to a role without the right. */
export const NOT_ALLOWED = {
  ok: false,
  error: "Anda tidak berhak mengelola pengguna dan peran.",
} as const;

export async function rolesOf(
  db: Database,
  accountId: string,
): Promise<RoleId[]> {
  const roles = await rolesByAccount(db, [accountId]);
  return roles.get(accountId) ?? [];
}

/**
 * Makes `wanted` the BAM roles of an account whose roles were `before`.
 * Its other roles stay. A log line is written only when the roles change.
 */
export async function saveBamRoles(
  tx: Database,
  accountId: string,
  before: RoleId[],
  wanted: BamRole[],
  by: string,
): Promise<void> {
  const kept = before.filter((role) => !isBamRole(role));
  const after = inRoleOrder([...kept, ...wanted]);
  if (sameRoles(before, after)) return;

  await tx
    .delete(accountRoles)
    .where(
      and(
        eq(accountRoles.accountId, accountId),
        inArray(accountRoles.role, [...BAM_ROLES]),
      ),
    );
  if (wanted.length > 0) {
    await tx
      .insert(accountRoles)
      .values(wanted.map((role) => ({ accountId, role })))
      .onConflictDoNothing();
  }
  await tx.insert(roleChanges).values({
    accountId,
    changedBy: by,
    action: "roles_changed",
    rolesBefore: before,
    rolesAfter: after,
  });
}
