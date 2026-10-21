/*
 * The rules of mandatory counselling sent from a discipline penalty. Read
 * by the screen parts in the browser, so nothing here may take from the
 * database code.
 */

/** "Pesan untuk konselor" as it is kept: without spaces around it, none when empty. */
export function senderMessageOf(typed: string): string | null {
  const message = typed.trim();
  return message === "" ? null : message;
}
