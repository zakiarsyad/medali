import { isCampusEmail } from "./campus-email";
import type { ConfirmedAddress } from "./google-token";
import type { SignInRefusal } from "./sign-in-results";

export type SignInDecision =
  | { result: "signed_in"; accountId: string }
  | { result: SignInRefusal };

/**
 * Whether Google's answer stands for a campus account. The address alone
 * is not enough: a personal Google account once made with a campus
 * address keeps that address after the campus closes the mailbox or
 * gives it to someone else. Only an account the campus itself runs at
 * Google names the campus as its hosted domain.
 */
function isCampusAccount(answer: ConfirmedAddress, ending: string): boolean {
  if (!answer.verified) return false;
  if (!isCampusEmail(answer.email, ending)) return false;
  const campusDomain = ending.slice(1);
  return answer.hostedDomain === campusDomain;
}

/**
 * Who gets in. `answer` is what Google confirmed, or null when its answer
 * could not be trusted. `campusEnding` is the ending from the settings,
 * starting with "@". `accountId` is the active account that holds the
 * address, or null when there is none.
 */
export function decideSignIn(
  answer: ConfirmedAddress | null,
  campusEnding: string,
  accountId: string | null,
): SignInDecision {
  if (!answer) return { result: "failed" };
  if (!isCampusAccount(answer, campusEnding)) {
    return { result: "refused_outside_campus" };
  }
  if (!accountId) return { result: "refused_no_account" };
  return { result: "signed_in", accountId };
}
