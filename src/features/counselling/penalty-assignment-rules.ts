import type { FormState } from "@/ui/form-message";
import { ALREADY_ASSIGNED } from "./penalty-assignment-words";

/*
 * The rules of mandatory counselling sent from a discipline penalty. Read
 * by the screen parts in the browser, so nothing here may take from the
 * database code.
 */

/**
 * Whether "Rincian" is read again after a send: once there is a
 * Penugasan, by this send or by someone else's just before, so its status
 * box takes the place of the button.
 */
export function readsPageAgain(answer: FormState): boolean {
  return answer.done !== null || answer.error === ALREADY_ASSIGNED;
}

/** "Pesan untuk konselor" as it is kept: without spaces around it, none when empty. */
export function senderMessageOf(typed: string): string | null {
  const message = typed.trim();
  return message === "" ? null : message;
}
