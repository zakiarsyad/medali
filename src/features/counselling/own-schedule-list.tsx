import shared from "@/ui/data-screen.module.css";
import styles from "./counselling.module.css";
import { OwnScheduleCard } from "./own-schedule-card";
import type { OwnScheduleView } from "./schedule-view";

/** "Jadwal konseling saya": the student's active requests, the newest first. */
export function OwnScheduleList({
  schedules,
}: {
  schedules: OwnScheduleView[];
}) {
  return (
    <section className={`${shared.panel} ${styles.stack}`}>
      <div className={styles.panelHead}>
        <h2 className={shared.heading}>Jadwal konseling saya</h2>
        <span className={styles.sub}>{schedules.length} aktif</span>
      </div>
      {schedules.length === 0 ? (
        <p className={shared.empty}>Belum ada jadwal konseling.</p>
      ) : (
        <ul className={styles.cards}>
          {schedules.map((schedule) => (
            <OwnScheduleCard key={schedule.id} schedule={schedule} />
          ))}
        </ul>
      )}
    </section>
  );
}
