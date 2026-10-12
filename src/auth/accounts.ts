import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { accountRoles, accounts, students, studyPrograms } from "@/db/schema";
import { staffThenStudents } from "./account-order";
import { ROLE_IDS, type RoleId } from "./role-ids";
import { workingRoles } from "./working-roles";

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

/**
 * Active accounts, those not removed, with the roles that work right
 * now: see `workingRoles`. Both the signed-in account of every request
 * and the accounts of Ganti peran are read here, so neither can skip it.
 */
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
      studentStatus: students.status,
      studentRemovedAt: students.deletedAt,
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
  return rows.map(({ studentStatus, studentRemovedAt, ...account }) => {
    const student =
      studentStatus === null
        ? null
        : { status: studentStatus, deletedAt: studentRemovedAt };
    return {
      ...account,
      roles: workingRoles(roles.get(account.id) ?? [], student),
    };
  });
}

export function isAccountId(id: string): boolean {
  return isUuid(id);
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

/**
 * The id of the active account that holds an address, or null. Addresses
 * are kept in small letters, so `email` must be in small letters too.
 */
export async function activeAccountIdByEmail(
  db: Database,
  email: string,
): Promise<string | null> {
  const [found] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.email, email), isNull(accounts.deletedAt)))
    .limit(1);
  return found?.id ?? null;
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

/** Every active account, in the order of Ganti peran: see `staffThenStudents`. */
export async function accountsInRoleOrder(db: Database): Promise<Account[]> {
  return staffThenStudents(await activeAccounts(db));
}
