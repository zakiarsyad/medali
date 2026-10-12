import { isCampusEmail } from "@/auth/campus-email";
import type { Parsed } from "@/parsed";
import { isFullName, isWellFormedEmail } from "./account-input";

/** The first account of an empty app: who it is, and their campus address. */
export interface FirstAccount {
  name: string;
  email: string;
}

function refused(error: string): Parsed<FirstAccount> {
  return { ok: false, error };
}

/**
 * Checks what the first-account command was given: a name, then an
 * address. `campusEnding` is the campus address ending from the settings.
 * Unlike in Pengguna dan peran it must be set: the first account can only
 * get in with an address that sign-in takes.
 */
export function parseFirstAccount(
  args: readonly string[],
  campusEnding: string,
): Parsed<FirstAccount> {
  const [writtenName, writtenEmail, ...more] = args;
  const isNameAndAddress =
    writtenName !== undefined &&
    writtenEmail !== undefined &&
    more.length === 0;
  if (!isNameAndAddress) {
    return refused(
      'Give a name and a campus address, the name in quotes: "Nama Lengkap" nama@kampus.example',
    );
  }
  if (campusEnding === "") {
    return refused(
      "The setting CAMPUS_EMAIL_ENDING is empty, so no address is a campus one. Fill it in first.",
    );
  }
  const name = writtenName.trim();
  if (!isFullName(name)) return refused("Give the full name of the person.");
  const email = writtenEmail.trim().toLowerCase();
  if (!isWellFormedEmail(email)) {
    return refused("The address is not a well-formed email address.");
  }
  if (!isCampusEmail(email, campusEnding)) {
    return refused(
      `The address does not end with the campus address ending, ${campusEnding}.`,
    );
  }
  return { ok: true, value: { name, email } };
}
