import { refusedWhenEmailInUse } from "@/auth/account-email";
import { firstAccountWithRole } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { faultCodeOf } from "@/db/refusal";
import type { Parsed } from "@/parsed";
import type { FirstAccount } from "./first-account";
import { waitForHeadOfUnitChanges } from "./head-of-unit-lock";
import { saveNewAccount } from "./manage-accounts";

const ALREADY_THERE = {
  ok: false,
  error:
    "A Kepala Unit account already exists. This command only makes the first one; that account adds everyone else in the app.",
} as const;

/**
 * What an account command says of a fault while it ran, after `notDone`.
 * The database's own words for a failed write repeat the name and the
 * address, so only the fault's code is shown.
 */
export function accountCommandFault(
  fault: unknown,
  notDone = "The account was not made",
): string {
  const code = faultCodeOf(fault);
  if (code === null) {
    return `${notDone}: an unexpected fault stopped the command. Nothing was changed.`;
  }
  return `${notDone}: the database, or the way to it, failed (code ${code}). Nothing was changed. Check that the package is started, then run the command again. If it fails again, report the code.`;
}

/**
 * Makes the first account, with the role Kepala Unit and its line in the
 * log of role changes, or nothing at all. It is refused once an account
 * that is not removed holds that role.
 */
export async function addFirstAccount(
  db: Database,
  account: FirstAccount,
): Promise<Parsed<string>> {
  try {
    return await refusedWhenEmailInUse(
      () => addUnlessHeadOfUnitExists(db, account),
      "Another account already uses this address.",
    );
  } catch (fault) {
    return { ok: false, error: accountCommandFault(fault) };
  }
}

function addUnlessHeadOfUnitExists(
  db: Database,
  account: FirstAccount,
): Promise<Parsed<string>> {
  return db.transaction(async (tx) => {
    await waitForHeadOfUnitChanges(tx);
    if (await firstAccountWithRole(tx, "head_of_unit")) return ALREADY_THERE;
    const id = await saveNewAccount(
      tx,
      {
        ...account,
        title: null,
        nip: null,
        unit: null,
        studyProgramId: null,
        roles: ["head_of_unit"],
      },
      null,
    );
    return { ok: true, value: id };
  });
}
