import { isCampusEmail } from "./campus-email";
import type { ConfirmedAddress } from "./google-token";
import type { SignInRefusal } from "./sign-in-results";

export type SignInDecision =
  | { result: "signed_in"; accountId: string }
  | { result: SignInRefusal };

/**
 * Who gets in. `answer` is what Google confirmed, or null when its answer
 * could not be trusted. `accountId` is the active account that holds the
 * address, or null when there is none.
 */
export function decideSignIn(
  answer: ConfirmedAddress | null,
  campusEnding: string,
  accountId: string | null,
): SignInDecision {
  if (!answer) return { result: "failed" };
  if (!answer.verified || !isCampusEmail(answer.email, campusEnding)) {
    return { result: "refused_outside_campus" };
  }
  if (!accountId) return { result: "refused_no_account" };
  return { result: "signed_in", accountId };
}
