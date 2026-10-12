/**
 * Everything the sign-in log can hold. Each is something only Google's
 * verified answer or a real session can bring about, so nobody can fill
 * the log, which can never be emptied, by sending requests by hand.
 */
export const SIGN_IN_RESULTS = [
  "signed_in",
  "signed_out",
  "refused_outside_campus",
  "refused_no_account",
] as const;

export type SignInResult = (typeof SIGN_IN_RESULTS)[number];

/** A refusal of an address that Google did confirm. */
export type ConfirmedRefusal = Exclude<
  SignInResult,
  "signed_in" | "signed_out"
>;

/**
 * The ways a sign-in ends with nobody signed in. "failed" is a sign-in
 * that never got a trusted answer from Google. Anyone can cause one, so
 * it is told to the person and not written to the log.
 */
export type SignInRefusal = ConfirmedRefusal | "failed";
