import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import {
  type ClarificationCounts,
  countClarifications,
} from "./clarification-counts";
import {
  type ClarificationList,
  readClarificationList,
} from "./clarification-list";
import type {
  ClarificationFilters,
  ClarificationListParams,
} from "./clarification-list-address";
import { mayDecideClarifications } from "./may-decide-clarifications";

/** What the tab "Klarifikasi kehadiran" shows. */
export interface Clarifications {
  /** Every clarification by its status, whatever the filters. */
  counts: ClarificationCounts;
  filters: ClarificationFilters;
  /**
   * The page of the cards the address asked for. The list may show an
   * earlier one, when the page asked for holds no card any more.
   */
  askedPage: number;
  list: ClarificationList;
}

export type ClarificationsAnswer =
  | { kind: "refused" }
  | { kind: "found"; clarifications: Clarifications };

/**
 * The numbers and one page of the clarification cards, for an account
 * that may decide clarifications. Anyone else is refused before anything
 * is read. `keepsFiles` is whether this place has a file storage.
 */
export async function readClarifications(
  db: Database,
  account: AccountForAccess,
  params: ClarificationListParams,
  keepsFiles: boolean,
): Promise<ClarificationsAnswer> {
  if (!mayDecideClarifications(account)) return { kind: "refused" };
  const { filters, page } = params;
  const [counts, list] = await Promise.all([
    countClarifications(db),
    readClarificationList(db, filters, page, keepsFiles),
  ]);
  return {
    kind: "found",
    clarifications: { counts, filters, askedPage: page, list },
  };
}
