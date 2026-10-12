import type { SignInRefusal } from "./sign-in-results";

export const SIGN_IN_PATH = "/masuk";

/** The short word in the address that says why a sign-in was refused. */
const REFUSAL_CODES: Record<SignInRefusal, string> = {
  refused_outside_campus: "kampus",
  refused_no_account: "akun",
  failed: "gagal",
};

const REFUSAL_MESSAGES: Record<SignInRefusal, string> = {
  refused_outside_campus: "Gunakan akun Google kampus.",
  refused_no_account:
    "Akun Anda belum terdaftar. Hubungi Unit Pembangunan Karakter.",
  failed: "Masuk dengan Google gagal. Coba lagi.",
};

const REFUSALS = Object.keys(REFUSAL_CODES) as SignInRefusal[];

/** The sign-in page, told why the sign-in was refused. */
export function refusalAddress(refusal: SignInRefusal): string {
  return `${SIGN_IN_PATH}?pesan=${REFUSAL_CODES[refusal]}`;
}

/**
 * What the sign-in page says for the word in its address, or null. The
 * word comes from outside: it only picks one of the messages written
 * here, and no text from the address is ever shown.
 */
export function refusalMessage(code: string): string | null {
  const refusal = REFUSALS.find((known) => REFUSAL_CODES[known] === code);
  return refusal ? REFUSAL_MESSAGES[refusal] : null;
}
