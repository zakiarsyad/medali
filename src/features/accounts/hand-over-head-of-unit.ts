import { and, eq } from "drizzle-orm";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { accountRoles, accounts, roleChanges } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { Parsed } from "@/parsed";
import { waitForHeadOfUnitChanges } from "./head-of-unit-lock";
import { currentRoles, inRoleOrder, lockActive } from "./manage-accounts";

const NOT_FOUND = { ok: false, error: "Akun tidak ditemukan." } as const;

const ONLY_HEAD_OF_UNIT = {
  ok: false,
  error: "Hanya Kepala Unit yang bisa menyerahkan jabatan Kepala Unit.",
} as const;

const NOT_TO_YOURSELF = {
  ok: false,
  error: "Anda sudah menjadi Kepala Unit. Pilih akun lain.",
} as const;

const ALREADY_HEAD_OF_UNIT = {
  ok: false,
  error: "Akun ini sudah menjadi Kepala Unit.",
} as const;

export const STUDENT_CANNOT_LEAD = {
  ok: false,
  error: "Akun mahasiswa tidak bisa menjadi Kepala Unit.",
} as const;

/** Gives Kepala Unit to an account that holds `before`, with its log line. */
export async function giveHeadOfUnit(
  tx: Database,
  accountId: string,
  before: RoleId[],
  by: string,
): Promise<void> {
  await tx.insert(accountRoles).values({ accountId, role: "head_of_unit" });
  await tx.insert(roleChanges).values({
    accountId,
    changedBy: by,
    changedAt: WRITTEN_NOW,
    action: "roles_changed",
    rolesBefore: before,
    rolesAfter: inRoleOrder([...before, "head_of_unit"]),
  });
}

/**
 * Takes Kepala Unit from an account that holds `before`, with its log
 * line. An account left with no role is marked removed, as "Hapus" does.
 */
export async function takeHeadOfUnit(
  tx: Database,
  accountId: string,
  before: RoleId[],
  by: string,
): Promise<void> {
  const after = before.filter((role) => role !== "head_of_unit");
  await tx
    .delete(accountRoles)
    .where(
      and(
        eq(accountRoles.accountId, accountId),
        eq(accountRoles.role, "head_of_unit"),
      ),
    );
  if (after.length === 0) {
    await tx
      .update(accounts)
      .set({ deletedAt: new Date(), deletedBy: by })
      .where(eq(accounts.id, accountId));
  }
  await tx.insert(roleChanges).values({
    accountId,
    changedBy: by,
    changedAt: WRITTEN_NOW,
    action: after.length === 0 ? "removed" : "roles_changed",
    rolesBefore: before,
    rolesAfter: after,
  });
}

/**
 * Kepala Unit `by` hands the role to another active staff account. Both
 * keep their other roles. Both accounts are held until the end, so a
 * change of their roles in Pengguna dan peran waits for the handover.
 */
export async function handOverHeadOfUnit(
  db: Database,
  accountId: string,
  by: string,
): Promise<Parsed<null>> {
  return db.transaction(async (tx) => {
    await waitForHeadOfUnitChanges(tx);
    const giver = await lockActive(tx, by);
    const giverRoles = giver ? await currentRoles(tx, by) : [];
    if (!giverRoles.includes("head_of_unit")) return ONLY_HEAD_OF_UNIT;
    if (accountId === by) return NOT_TO_YOURSELF;
    const chosen = await lockActive(tx, accountId);
    if (!chosen) return NOT_FOUND;
    if (chosen.studentId !== null) return STUDENT_CANNOT_LEAD;
    const chosenRoles = await currentRoles(tx, accountId);
    if (chosenRoles.includes("head_of_unit")) return ALREADY_HEAD_OF_UNIT;

    await giveHeadOfUnit(tx, accountId, chosenRoles, by);
    await takeHeadOfUnit(tx, by, giverRoles, by);
    return { ok: true, value: null };
  });
}
