import {
  and,
  asc,
  count,
  eq,
  exists,
  ilike,
  inArray,
  isNull,
  notInArray,
  or,
  type SQL,
} from "drizzle-orm";
import { rolesByAccount } from "@/auth/accounts";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { containsPattern } from "@/db/contains-pattern";
import {
  accountRoles,
  accounts,
  roleChanges,
  studyPrograms,
} from "@/db/schema";
import type { Parsed } from "@/parsed";
import type { NewAccount, RoleChange } from "./account-input";
import { isManagedRole, LISTED_ROLES, type ListedRole } from "./managed-roles";

export const PAGE_SIZE = 25;

export interface ManagedAccount {
  id: string;
  name: string;
  title: string | null;
  nip: string | null;
  email: string | null;
  unit: string | null;
  studyProgramId: number | null;
  studyProgram: string | null;
  roles: RoleId[];
}

export interface AccountFilter {
  query: string;
  role: ListedRole | null;
  page: number;
}

const NOT_FOUND = { ok: false, error: "Akun tidak ditemukan." } as const;

function inRoleOrder(roles: RoleId[]): RoleId[] {
  return [...roles].sort((a, b) => ROLE_IDS.indexOf(a) - ROLE_IDS.indexOf(b));
}

function sameRoles(a: RoleId[], b: RoleId[]): boolean {
  return inRoleOrder(a).join() === inRoleOrder(b).join();
}

function listCondition(db: Database, filter: AccountFilter): SQL | undefined {
  const wanted = filter.role ? [filter.role] : [...LISTED_ROLES];
  const hasWantedRole = exists(
    db
      .select({ accountId: accountRoles.accountId })
      .from(accountRoles)
      .where(
        and(
          eq(accountRoles.accountId, accounts.id),
          inArray(accountRoles.role, wanted),
        ),
      ),
  );
  const query = filter.query.trim();
  const pattern = containsPattern(query);
  const matches = query
    ? or(
        ilike(accounts.name, pattern),
        ilike(accounts.nip, pattern),
        ilike(accounts.email, pattern),
      )
    : undefined;
  return and(isNull(accounts.deletedAt), hasWantedRole, matches);
}

/** The staff accounts listed in Pengguna dan peran, one page at a time. */
export async function listManagedAccounts(
  db: Database,
  filter: AccountFilter,
): Promise<{ accounts: ManagedAccount[]; total: number }> {
  const condition = listCondition(db, filter);
  const [counted] = await db
    .select({ total: count() })
    .from(accounts)
    .where(condition);
  const rows = await db
    .select({
      id: accounts.id,
      name: accounts.name,
      title: accounts.title,
      nip: accounts.nip,
      email: accounts.email,
      unit: accounts.unit,
      studyProgramId: accounts.studyProgramId,
      studyProgram: studyPrograms.name,
    })
    .from(accounts)
    .leftJoin(studyPrograms, eq(studyPrograms.id, accounts.studyProgramId))
    .where(condition)
    .orderBy(asc(accounts.name))
    .limit(PAGE_SIZE)
    .offset(filter.page * PAGE_SIZE);
  const roles = await rolesByAccount(
    db,
    rows.map((row) => row.id),
  );
  return {
    accounts: rows.map((row) => ({ ...row, roles: roles.get(row.id) ?? [] })),
    total: counted?.total ?? 0,
  };
}

async function emailInUse(db: Database, email: string): Promise<boolean> {
  const [found] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.email, email), isNull(accounts.deletedAt)))
    .limit(1);
  return found !== undefined;
}

async function isActive(db: Database, accountId: string): Promise<boolean> {
  const [found] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.id, accountId), isNull(accounts.deletedAt)))
    .limit(1);
  return found !== undefined;
}

async function currentRoles(
  db: Database,
  accountId: string,
): Promise<RoleId[]> {
  const roles = await rolesByAccount(db, [accountId]);
  return roles.get(accountId) ?? [];
}

const UNKNOWN_PROGRAM = {
  ok: false,
  error: "Program studi tidak dikenal.",
} as const;

async function programIsKnown(
  db: Database,
  studyProgramId: number | null,
): Promise<boolean> {
  if (studyProgramId === null) return true;
  const [found] = await db
    .select({ id: studyPrograms.id })
    .from(studyPrograms)
    .where(eq(studyPrograms.id, studyProgramId))
    .limit(1);
  return found !== undefined;
}

export async function addAccount(
  db: Database,
  account: NewAccount,
  by: string,
): Promise<Parsed<string>> {
  if (!(await programIsKnown(db, account.studyProgramId))) {
    return UNKNOWN_PROGRAM;
  }
  if (await emailInUse(db, account.email)) {
    return { ok: false, error: "Email sudah dipakai pengguna lain." };
  }
  return db.transaction(async (tx) => {
    const { roles, ...fields } = account;
    const [added] = await tx
      .insert(accounts)
      .values(fields)
      .returning({ id: accounts.id });
    if (!added) throw new Error("The account was not added.");
    await tx
      .insert(accountRoles)
      .values(roles.map((role) => ({ accountId: added.id, role })));
    await tx.insert(roleChanges).values({
      accountId: added.id,
      changedBy: by,
      action: "added",
      rolesBefore: [],
      rolesAfter: inRoleOrder(roles),
    });
    return { ok: true, value: added.id };
  });
}

/**
 * Sets the managed roles of an account. Roles not managed here, such as
 * Kepala Unit or Mahasiswa, stay as they are.
 */
export async function changeRoles(
  db: Database,
  change: RoleChange,
  by: string,
): Promise<Parsed<RoleId[]>> {
  return db.transaction(async (tx) => {
    if (!(await isActive(tx, change.accountId))) return NOT_FOUND;
    if (!(await programIsKnown(tx, change.studyProgramId))) {
      return UNKNOWN_PROGRAM;
    }
    const before = await currentRoles(tx, change.accountId);
    const kept = before.filter((role) => !isManagedRole(role));
    const after = inRoleOrder([...kept, ...change.roles]);
    if (after.length === 0) {
      return { ok: false, error: "Pilih minimal satu peran." };
    }

    await tx
      .delete(accountRoles)
      .where(
        and(
          eq(accountRoles.accountId, change.accountId),
          notInArray(accountRoles.role, kept),
        ),
      );
    if (change.roles.length > 0) {
      await tx
        .insert(accountRoles)
        .values(
          change.roles.map((role) => ({ accountId: change.accountId, role })),
        )
        .onConflictDoNothing();
    }
    await tx
      .update(accounts)
      .set({
        studyProgramId: change.studyProgramId,
        ...(change.unit === null ? {} : { unit: change.unit }),
      })
      .where(eq(accounts.id, change.accountId));

    if (!sameRoles(before, after)) {
      await tx.insert(roleChanges).values({
        accountId: change.accountId,
        changedBy: by,
        action: "roles_changed",
        rolesBefore: before,
        rolesAfter: after,
      });
    }
    return { ok: true, value: after };
  });
}

/**
 * Marks an account removed. It is never erased. An account that holds a
 * role not managed here, such as Kepala Unit or Mahasiswa, is not removed
 * here; nor is the manager's own account.
 */
export async function removeAccount(
  db: Database,
  accountId: string,
  by: string,
): Promise<Parsed<null>> {
  return db.transaction(async (tx) => {
    if (!(await isActive(tx, accountId))) return NOT_FOUND;
    if (accountId === by) {
      return { ok: false, error: "Akun Anda sendiri tidak bisa dihapus." };
    }
    const before = await currentRoles(tx, accountId);
    if (!before.every(isManagedRole)) {
      return {
        ok: false,
        error: "Akun ini tidak dikelola di sini, sehingga tidak bisa dihapus.",
      };
    }
    await tx
      .update(accounts)
      .set({ deletedAt: new Date(), deletedBy: by })
      .where(eq(accounts.id, accountId));
    await tx.insert(roleChanges).values({
      accountId,
      changedBy: by,
      action: "removed",
      rolesBefore: before,
      rolesAfter: [],
    });
    return { ok: true, value: null };
  });
}
