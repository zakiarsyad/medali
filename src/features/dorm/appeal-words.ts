import { firstLetters, lettersIn } from "@/ui/letters-in";
import type { AppealStatus } from "./appeal-ids";

/*
 * How an appeal of a dorm violation is said on screen. Read by the
 * screen parts in the browser, so nothing here may take from the
 * database code.
 */

/** The appeal itself, as the resident's record shows it. */
export const APPEAL_BADGE_WORDS: Record<AppealStatus, string> = {
  waiting: "Diajukan",
  accepted: "Diterima",
  rejected: "Ditolak",
};

/** How much of Alasan advokasi a list shows. */
const SHOWN_REASON_LETTERS = 80;

/** The first 80 letters of Alasan advokasi, with … when there is more. */
export function shortReason(reason: string): string {
  if (lettersIn(reason) <= SHOWN_REASON_LETTERS) return reason;
  return `${firstLetters(reason, SHOWN_REASON_LETTERS)}…`;
}
