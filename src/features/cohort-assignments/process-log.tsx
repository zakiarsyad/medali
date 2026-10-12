import shared from "@/ui/data-screen.module.css";
import { shownMoment } from "@/ui/day";
import { CHANGE_TITLES } from "./assignment-steps";
import styles from "./cohort-assignments.module.css";
import type { LogLine } from "./stored-assignment";

/**
 * "Riwayat proses": who did what to the penetapan and when, the newest
 * first, folded until it is opened. Nothing here can be changed.
 */
export function ProcessLog({ log }: { log: LogLine[] }) {
  if (log.length === 0) return null;
  return (
    <details className={styles.log}>
      <summary className={styles.logTitle}>
        Riwayat proses ({log.length})
      </summary>
      <ul className={styles.logLines}>
        {log.map((line) => (
          <li key={line.id}>
            <b>{CHANGE_TITLES[line.action]}</b>
            <small className={shared.detail}>
              {line.by} · {shownMoment(line.at)}
            </small>
          </li>
        ))}
      </ul>
    </details>
  );
}
