import shared from "@/ui/data-screen.module.css";
import styles from "./discipline-penalties.module.css";
import type { PenaltyStatus } from "./penalty-ids";
import { STATUS_WORDS } from "./penalty-words";

/*
 * Read by the screen parts in the browser, so nothing here may take from
 * the database code.
 */

/** Dijatuhkan or Ditetapkan. */
export function StatusBadge({ status }: { status: PenaltyStatus }) {
  const look = status === "set" ? styles.set : "";
  return (
    <span className={`${shared.badge} ${look}`}>{STATUS_WORDS[status]}</span>
  );
}
