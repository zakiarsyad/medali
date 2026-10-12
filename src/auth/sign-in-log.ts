import type { Database } from "@/db/connect";
import { signInLog } from "@/db/schema";
import type { ConfirmedRefusal } from "./sign-in-results";

/**
 * One line of the sign-in log. A sign-in or a sign-out names its
 * account. A refusal names nobody: neither an account nor an address is
 * kept of someone who was not let in.
 */
export type SignInLogLine =
  | { result: "signed_in" | "signed_out"; accountId: string }
  | { result: ConfirmedRefusal };

export async function logSignIn(
  db: Database,
  line: SignInLogLine,
  now: Date,
): Promise<void> {
  await db.insert(signInLog).values({
    happenedAt: now,
    result: line.result,
    accountId: "accountId" in line ? line.accountId : null,
  });
}
