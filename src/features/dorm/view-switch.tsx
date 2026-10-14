import Link from "next/link";
import styles from "./activities.module.css";
import {
  ACTIVITY_VIEWS,
  type ActivitiesParams,
  activitiesAddress,
  VIEW_WORDS,
} from "./activities-address";

/** The switch between Jadwal harian, Kegiatan rutin and Kegiatan non rutin. */
export function ViewSwitch({
  params,
  today,
}: {
  params: ActivitiesParams;
  today: string;
}) {
  return (
    <nav className={styles.switch} aria-label="Daftar kegiatan">
      {ACTIVITY_VIEWS.map((view) => (
        <Link
          key={view}
          href={activitiesAddress({ ...params, view, page: 1 }, today)}
          className={styles.choice}
          aria-current={view === params.view ? "true" : undefined}
        >
          {VIEW_WORDS[view]}
        </Link>
      ))}
    </nav>
  );
}
