import type { ReactNode } from "react";
import type { CampusMoment } from "@/academic-periods/campus-clock";
import shared from "@/ui/data-screen.module.css";
import styles from "./activities.module.css";
import type { ResidentsByDorm } from "./activity-audience";
import type { ActivityRow } from "./activity-row";
import { dayWords } from "./activity-words";
import { DailyTable } from "./daily-table";
import { DaySwitch } from "./day-switch";

/** Jadwal harian: the day with the steps around it, and its activities. */
export function DailyPanel({
  day,
  activities,
  residents,
  now,
  actionsOf,
  leaveQuestion,
}: {
  day: string;
  activities: ActivityRow[];
  residents: ResidentsByDorm;
  now: CampusMoment;
  actionsOf: ((activity: ActivityRow) => ReactNode) | null;
  /** What is asked before another day opens, or null to ask nothing. */
  leaveQuestion: string | null;
}) {
  return (
    <section className={shared.panel}>
      <div className={styles.head}>
        <div>
          <h2 className={`${shared.heading} ${styles.title}`}>
            Jadwal kegiatan
          </h2>
          <p className={styles.quietLine}>{dayWords(day)}</p>
        </div>
        <DaySwitch day={day} today={now.day} leaveQuestion={leaveQuestion} />
      </div>
      {activities.length === 0 ? (
        <p className={shared.empty}>Tidak ada kegiatan pada tanggal ini.</p>
      ) : (
        <DailyTable
          activities={activities}
          day={day}
          now={now}
          residents={residents}
          actionsOf={actionsOf}
        />
      )}
    </section>
  );
}
