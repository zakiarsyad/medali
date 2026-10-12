import type { Database } from "@/db/connect";
import { activeAccountIdByEmail } from "./accounts";
import type { ConfirmedAddress } from "./google-token";
import { startSession } from "./sessions";
import type { SignInAttempt } from "./sign-in-attempt";
import { decideSignIn } from "./sign-in-decision";
import { logSignIn } from "./sign-in-log";
import type { SignInRefusal } from "./sign-in-results";

/** What Google is given to say whose sign-in a code stands for. */
export interface CodeExchange {
  code: string;
  verifier: string;
  nonce: string;
  returnAddress: string;
}

/**
 * Asks Google for the address behind a code. It gives null when Google's
 * answer cannot be trusted. The checks put a stand-in here.
 */
export interface AddressConfirmer {
  confirmAddress(exchange: CodeExchange): Promise<ConfirmedAddress | null>;
}

/** Google sign-in as it is set up, or null while it is off. */
export type SignInSetup = {
  google: AddressConfirmer;
  campusEnding: string;
} | null;

/** What came back from Google's page. Any part may be missing. */
export interface ReturnFromGoogle {
  code: string | null;
  attempt: SignInAttempt | null;
  returnAddress: string | null;
}

export type FinishedSignIn =
  | { result: "signed_in"; sessionToken: string }
  | { result: SignInRefusal };

async function confirmedAddress(
  setup: SignInSetup,
  back: ReturnFromGoogle,
): Promise<ConfirmedAddress | null> {
  if (!setup || !back.code || !back.attempt || !back.returnAddress) return null;
  return setup.google.confirmAddress({
    code: back.code,
    verifier: back.attempt.verifier,
    nonce: back.attempt.nonce,
    returnAddress: back.returnAddress,
  });
}

/**
 * Finishes a sign-in after Google sent the person back: signs in the
 * account that holds the confirmed address, or says why nobody is.
 * A line goes to the sign-in log once Google has confirmed an address:
 * for a sign-in, and for a refusal of that address.
 */
export async function finishSignIn(
  db: Database,
  setup: SignInSetup,
  back: ReturnFromGoogle,
  now: Date,
): Promise<FinishedSignIn> {
  const answer = await confirmedAddress(setup, back);
  const accountId = answer
    ? await activeAccountIdByEmail(db, answer.email)
    : null;
  const decision = decideSignIn(answer, setup?.campusEnding ?? "", accountId);
  // Anyone can open the return address, with any cookie and any code, and
  // the log can never be emptied. So a sign-in that got no trusted answer
  // from Google is told to the person and not logged.
  if (decision.result === "failed") return decision;
  if (decision.result !== "signed_in") {
    await logSignIn(db, decision, now);
    return decision;
  }
  const sessionToken = await startSession(db, decision.accountId, now);
  return { result: "signed_in", sessionToken };
}
