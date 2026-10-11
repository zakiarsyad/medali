import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { accountRoles, accounts, students, studyPrograms } from "@/db/schema";
import { ROLE_IDS, type RoleId } from "./role-ids";

export interface Account {
  id: string;
  name: string;
  title: string | null;
  unit: string | null;
  roles: RoleId[];
  studyProgramId: number | null;
  studentId: string | null;
  /** The study program of a student account. */
  studentProgram: string | null;
}

function byRoleOrder(a: RoleId, b: RoleId): number {
  return ROLE_IDS.indexOf(a) - ROLE_IDS.indexOf(b);
}

export async function rolesByAccount(
  db: Database,
  accountIds: string[],
): Promise<Map<string, RoleId[]>> {
  const found = new Map<string, RoleId[]>();
  if (accountIds.length === 0) return found;
  const rows = await db
    .select()
    .from(accountRoles)
    .where(inArray(accountRoles.accountId, accountIds));
  for (const row of rows) {
    const roles = found.get(row.accountId) ?? [];
    roles.push(row.role);
    found.set(row.accountId, roles);
  }
  for (const roles of found.values()) roles.sort(byRoleOrder);
  return found;
}

/** Active accounts, those not removed, with their roles. */
export async function activeAccounts(
  db: Database,
  onlyId?: string,
): Promise<Account[]> {
  const notRemoved = isNull(accounts.deletedAt);
  const rows = await db
    .select({
      id: accounts.id,
      name: accounts.name,
      title: accounts.title,
      unit: accounts.unit,
      studyProgramId: accounts.studyProgramId,
      studentId: accounts.studentId,
      studentProgram: studyPrograms.name,
    })
    .from(accounts)
    .leftJoin(students, eq(students.id, accounts.studentId))
    .leftJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .where(onlyId ? and(notRemoved, eq(accounts.id, onlyId)) : notRemoved)
    .orderBy(asc(accounts.name));
  const roles = await rolesByAccount(
    db,
    rows.map((row) => row.id),
  );
  return rows.map((row) => ({ ...row, roles: roles.get(row.id) ?? [] }));
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isAccountId(id: string): boolean {
  return UUID.test(id);
}

/** One active account, or null when the id is unknown, removed or malformed. */
export async function findActiveAccount(
  db: Database,
  id: string,
): Promise<Account | null> {
  if (!isAccountId(id)) return null;
  const [account] = await activeAccounts(db, id);
  return account ?? null;
}

/** The first active account that holds a role, by name. */
export async function firstAccountWithRole(
  db: Database,
  role: RoleId,
): Promise<Account | null> {
  const [first] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .innerJoin(accountRoles, eq(accountRoles.accountId, accounts.id))
    .where(and(isNull(accounts.deletedAt), eq(accountRoles.role, role)))
    .orderBy(asc(accounts.name))
    .limit(1);
  if (!first) return null;
  return findActiveAccount(db, first.id);
}

function firstRoleIndex(account: Account): number {
  const first = account.roles[0];
  return first ? ROLE_IDS.indexOf(first) : ROLE_IDS.length;
}

/** Every active account, grouped by its first role in role order. */
export async function accountsInRoleOrder(db: Database): Promise<Account[]> {
  const found = await activeAccounts(db);
  return found.sort(
    (a, b) =>
      firstRoleIndex(a) - firstRoleIndex(b) || a.name.localeCompare(b.name),
  );
}
