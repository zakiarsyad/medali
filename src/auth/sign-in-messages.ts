import type { SignInRefusal } from "./sign-in-results";

export const SIGN_IN_PATH = "/masuk";

/** The short word in the address that says why a sign-in was refused. */
const REFUSAL_CODES: Record<SignInRefusal, string> = {
  refused_outside_campus: "kampus",
  refused_no_account: "akun",
  failed: "gagal",
};

/** The sign-in page, told why the sign-in was refused. */
export function refusalAddress(refusal: SignInRefusal): string {
  return `${SIGN_IN_PATH}?pesan=${REFUSAL_CODES[refusal]}`;
}
