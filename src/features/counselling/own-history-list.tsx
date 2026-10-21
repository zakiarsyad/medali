import Link from "next/link";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import styles from "./counselling.module.css";
import { moreHistoryAddress } from "./schedule-address";
import { ScheduleBadge } from "./schedule-card-parts";
import type { OwnHistory } from "./schedule-view";
import { kindTitle, SCHEDULE_TOPIC_WORDS } from "./schedule-words";

/**
 * "Riwayat": the student's requests that are over, the latest first, each
 * with its date, status and Topik, and 10 more on request. Not shown
 * while there is none.
 */
export function OwnHistoryList({ history }: { history: OwnHistory }) {
  if (history.items.length === 0) return null;
  return (
    <section className={`${shared.panel} ${styles.stack}`}>
      <h2 className={shared.heading}>Riwayat</h2>
      <ul className={styles.history}>
        {history.items.map((item) => (
          <li key={item.id}>
            <span className={styles.sub}>{shownDay(item.day)}</span>
            <b>{kindTitle(item.kind)}</b>
            <ScheduleBadge status={item.status} />
            <span>{SCHEDULE_TOPIC_WORDS[item.topic]}</span>
          </li>
        ))}
      </ul>
      {history.hasMore && (
        <Link
          href={moreHistoryAddress(history.shown)}
          scroll={false}
          className={shared.link}
        >
          Tampilkan lebih banyak
        </Link>
      )}
    </section>
  );
}
