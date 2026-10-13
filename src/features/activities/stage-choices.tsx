import Link from "next/link";
import { STAGES } from "@/academic-periods/stages";
import styles from "./activities.module.css";
import { scheduleListAddress } from "./schedule-list-address";

/** "Semua" and the four tahap above the list, each a link to its list. */
export function StageChoices({ open }: { open: number | null }) {
  return (
    <nav className={styles.choices} aria-label="Tahap">
      <Link
        href={scheduleListAddress(null)}
        className={styles.choice}
        aria-current={open === null ? "true" : undefined}
      >
        Semua
      </Link>
      {STAGES.map((name, place) => (
        <Link
          key={name}
          href={scheduleListAddress(place + 1)}
          className={styles.choice}
          aria-current={open === place + 1 ? "true" : undefined}
        >
          {name}
        </Link>
      ))}
    </nav>
  );
}
