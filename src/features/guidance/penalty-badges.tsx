import { toneBadge } from "@/ui/tone-badge";
import type { PenaltyStatus } from "./penalty-ids";
import { STATUS_WORDS } from "./penalty-words";

/*
 * Read by the screen parts in the browser, so nothing here may take from
 * the database code.
 */

/** Dijatuhkan or Ditetapkan. */
export function StatusBadge({ status }: { status: PenaltyStatus }) {
  const tone = status === "set" ? "bad" : null;
  return <span className={toneBadge(tone)}>{STATUS_WORDS[status]}</span>;
}
