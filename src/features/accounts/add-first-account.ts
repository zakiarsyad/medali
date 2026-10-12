import { sql } from "drizzle-orm";
import { firstAccountWithRole } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { brokeUniqueRule } from "@/db/unique-violation";
import type { Parsed } from "@/parsed";
import type { FirstAccount } from "./first-account";
import { EMAIL_IN_USE_RULE, saveNewAccount } from "./manage-accounts";

/**
 * The number two runs of this command wait for each other on. Without it
 * both could see no Kepala Unit at the same moment, and both add one.
 */
const FIRST_ACCOUNT_LOCK = 123_001;

const ALREADY_THERE = {
  ok: false,
  error:
    "A Kepala Unit account already exists. This command only makes the first one; that account adds everyone else in the app.",
} as const;

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
    return await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(${FIRST_ACCOUNT_LOCK})`,
      );
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
  } catch (error) {
    if (brokeUniqueRule(error, EMAIL_IN_USE_RULE)) {
      return { ok: false, error: "Another account already uses this address." };
    }
    throw error;
  }
}
