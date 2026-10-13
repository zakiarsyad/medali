import shared from "@/ui/data-screen.module.css";
import styles from "./activities.module.css";
import { whenWords } from "./student-activity-words";
import type { StudentSchedule } from "./student-schedule";
import { ValueTags } from "./value-tags";

/** "Akan datang": the next few schedules, the earliest first. */
export function ComingActivities({
  schedules,
}: {
  schedules: StudentSchedule[];
}) {
  return (
    <section className={styles.part}>
      <h2 className={shared.heading}>Akan datang</h2>
      <div className={shared.panel}>
        {schedules.length === 0 ? (
          <p className={shared.empty}>Belum ada jadwal berikutnya.</p>
        ) : (
          <ul className={styles.comingList}>
            {schedules.map((schedule) => (
              <li key={schedule.id} className={styles.comingItem}>
                <b>{schedule.name}</b>
                <span className={shared.detail}>{whenWords(schedule)}</span>
                <span className={styles.tags}>
                  <ValueTags valueKeys={schedule.valueKeys} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
