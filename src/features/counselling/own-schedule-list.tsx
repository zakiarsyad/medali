import shared from "@/ui/data-screen.module.css";
import styles from "./counselling.module.css";
import { OwnScheduleItem } from "./own-schedule-item";
import { ScheduleNotice } from "./schedule-notice";
import type { OwnScheduleView } from "./schedule-view";

/** "Jadwal konseling saya": the student's active requests, the newest first. */
export function OwnScheduleList({
  schedules,
  tomorrow,
}: {
  schedules: OwnScheduleView[];
  /** The first day "Minta waktu lain" may pick. */
  tomorrow: string;
}) {
  return (
    <section className={`${shared.panel} ${styles.stack}`}>
      <div className={styles.panelHead}>
        <h2 className={shared.heading}>Jadwal konseling saya</h2>
        <span className={styles.sub}>{schedules.length} aktif</span>
      </div>
      <ScheduleNotice>
        {schedules.length === 0 ? (
          <p className={shared.empty}>Belum ada jadwal konseling.</p>
        ) : (
          <ul className={styles.cards}>
            {schedules.map((schedule) => (
              <OwnScheduleItem
                key={schedule.id}
                schedule={schedule}
                tomorrow={tomorrow}
              />
            ))}
          </ul>
        )}
      </ScheduleNotice>
    </section>
  );
}
