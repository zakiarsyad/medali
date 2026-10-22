/*
 * A resident who also holds a BAM role never decides their own dorm
 * record. Read by the screen parts in the browser, so nothing here may
 * take from the database code.
 */

/** What a decision on the account's own record answers. */
export const OWN_RECORD = {
  ok: false,
  error: "Data Anda sendiri diputus oleh anggota BAM atau pengelola lain.",
} as const;

/** The line shown in place of the deciding buttons on the account's own record. */
export const OWN_RECORD_NOTE = "Diputus oleh anggota BAM atau pengelola lain.";

/**
 * Whether a record's student is the account's own. A student key is
 * accepted in capitals too, so both sides are made lower case first.
 */
export function isOwnRecord(
  ownStudentId: string | null,
  studentId: string,
): boolean {
  if (ownStudentId === null) return false;
  return ownStudentId.toLowerCase() === studentId.toLowerCase();
}
