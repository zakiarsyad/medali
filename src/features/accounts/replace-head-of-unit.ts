import { and, eq, isNull, ne } from "drizzle-orm";
import { refusedWhenEmailInUse } from "@/auth/account-email";
import { activeAccountIdByEmail } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { accountRoles, accounts } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { accountCommandFault } from "./add-first-account";
import type { FirstAccount } from "./first-account";
import { giveHeadOfUnit, takeHeadOfUnit } from "./hand-over-head-of-unit";
import { waitForHeadOfUnitChanges } from "./head-of-unit-lock";
import { currentRoles, lockActive, saveNewAccount } from "./manage-accounts";

const STUDENT_ACCOUNT = {
  ok: false,
  error:
    "This address belongs to a student account, which cannot be Kepala Unit. Nothing was changed.",
} as const;

/**
 * Makes the account with the address the one Kepala Unit, for when the
 * Kepala Unit in office is gone and cannot hand over in the app. The
 * account is made when no active account has the address. Nobody else is
 * there to name in the log, so each line names the new Kepala Unit as the
 * one who changed it.
 */
export async function replaceHeadOfUnit(
  db: Database,
  person: FirstAccount,
): Promise<Parsed<string>> {
  try {
    return await refusedWhenEmailInUse(
      () => replaceAllAtOnce(db, person),
      "Another account already uses this address.",
    );
  } catch (fault) {
    return {
      ok: false,
      error: accountCommandFault(fault, "The handover was not made"),
    };
  }
}

function replaceAllAtOnce(
  db: Database,
  person: FirstAccount,
): Promise<Parsed<string>> {
  return db.transaction(async (tx) => {
    await waitForHeadOfUnitChanges(tx);
    const head = await headOfUnitFor(tx, person);
    if (!head.ok) return head;
    await takeFromEveryOther(tx, head.value);
    return head;
  });
}

async function headOfUnitFor(
  tx: Database,
  person: FirstAccount,
): Promise<Parsed<string>> {
  const found = await activeAccountIdByEmail(tx, person.email);
  const account = found === null ? null : await lockActive(tx, found);
  if (found === null || account === null) {
    const id = await saveNewAccount(
      tx,
      {
        ...person,
        title: null,
        nip: null,
        unit: null,
        studyProgramId: null,
        roles: ["head_of_unit"],
      },
      null,
    );
    return { ok: true, value: id };
  }
  if (account.studentId !== null) return STUDENT_ACCOUNT;
  const roles = await currentRoles(tx, found);
  if (!roles.includes("head_of_unit")) {
    await giveHeadOfUnit(tx, found, roles, found);
  }
  return { ok: true, value: found };
}

async function takeFromEveryOther(tx: Database, headId: string) {
  const others = await tx
    .select({ id: accounts.id })
    .from(accounts)
    .innerJoin(accountRoles, eq(accountRoles.accountId, accounts.id))
    .where(
      and(
        isNull(accounts.deletedAt),
        eq(accountRoles.role, "head_of_unit"),
        ne(accounts.id, headId),
      ),
    );
  for (const other of others) {
    if (!(await lockActive(tx, other.id))) continue;
    const roles = await currentRoles(tx, other.id);
    await takeHeadOfUnit(tx, other.id, roles, headId);
  }
}
