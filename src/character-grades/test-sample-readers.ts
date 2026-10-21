import { type Account, activeAccounts } from "@/auth/accounts";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";

/** A day long before every sample period, when no period runs. */
export const NO_PERIOD_DAY = "2000-01-03";

/** The roles that open Penilaian karakter, each seeing its own students. */
const READER_ROLES: RoleId[] = [
  "head_of_unit",
  "director",
  "assessor",
  "head_of_program",
  "mentor",
];

/** How many accounts of each role a check compares. */
const PER_ROLE = 2;

/**
 * Accounts of the sample data that open the tab: up to the first two of
 * each role, so a role with more than one account is compared with two
 * different sets of students, and the check stays short.
 */
export async function sampleReaders(db: Database): Promise<Account[]> {
  const accounts = await activeAccounts(db);
  const readers: Account[] = [];
  for (const role of READER_ROLES) {
    const holders = accounts.filter((account) => account.roles.includes(role));
    if (holders.length === 0) throw new Error(`No sample account is ${role}.`);
    readers.push(...holders.slice(0, PER_ROLE));
  }
  return readers;
}
