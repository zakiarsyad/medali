import type { Account } from "./accounts";
import { ROLE_IDS } from "./role-ids";

function isStudentAccount(account: Account): boolean {
  return account.roles.includes("student");
}

function byName(a: Account, b: Account): number {
  return a.name.localeCompare(b.name);
}

function firstRoleIndex(account: Account): number {
  const first = account.roles[0];
  return first ? ROLE_IDS.indexOf(first) : ROLE_IDS.length;
}

function byFirstRoleThenName(a: Account, b: Account): number {
  return firstRoleIndex(a) - firstRoleIndex(b) || byName(a, b);
}

/**
 * The order of Ganti peran: staff accounts by their first role in role
 * order, then the student accounts by name. Students are many, so in the
 * middle they would push the staff accounts after them far down the list.
 */
export function staffThenStudents(accounts: Account[]): Account[] {
  const staff = accounts.filter((account) => !isStudentAccount(account));
  const students = accounts.filter(isStudentAccount);
  return [...staff.sort(byFirstRoleThenName), ...students.sort(byName)];
}
