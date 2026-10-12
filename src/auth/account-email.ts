import type { Parsed } from "@/parsed";
import { isCampusEmail } from "./campus-email";

/** The database's rule that an address belongs to one active account. */
export const EMAIL_IN_USE_RULE = "accounts_email_in_use";

export const EMAIL_IN_USE = "Email sudah dipakai akun lain.";
export const NOT_CAMPUS_EMAIL = "Gunakan alamat email kampus.";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Checks the address an account is to hold, staff or student, and gives
 * it as it is kept: in small letters, with the spaces around it dropped.
 * `campusEnding` is the campus address ending from the settings: once it
 * is set the address must end with it, because no other address can sign
 * in. While it is empty any well-formed address is taken. `malformed` is
 * what the screen says of an address that is not well formed.
 */
export function parseAccountEmail(
  text: string,
  campusEnding: string,
  malformed: string,
): Parsed<string> {
  const email = text.trim().toLowerCase();
  if (!EMAIL.test(email)) return { ok: false, error: malformed };
  if (campusEnding !== "" && !isCampusEmail(email, campusEnding)) {
    return { ok: false, error: NOT_CAMPUS_EMAIL };
  }
  return { ok: true, value: email };
}
