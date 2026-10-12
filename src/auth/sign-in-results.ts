/** Every way a sign-in or a sign-out can end. */
export const SIGN_IN_RESULTS = [
  "signed_in",
  "signed_out",
  "refused_outside_campus",
  "refused_no_account",
  "failed",
] as const;

export type SignInResult = (typeof SIGN_IN_RESULTS)[number];

/** The ways a sign-in ends with nobody signed in. */
export type SignInRefusal = Exclude<SignInResult, "signed_in" | "signed_out">;
