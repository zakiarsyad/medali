import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import styles from "./activities.module.css";
import type { ScheduleList } from "./list-schedules";
import type { CohortCount } from "./participants";
import { scheduleListAddress } from "./schedule-list-address";
import type { CampusMoment } from "./schedule-status";
import { ScheduleTable } from "./schedule-table";
import { StageChoices } from "./stage-choices";

/** "Jadwal dan kehadiran": the tahap choice, the schedules and their pages. */
export function ScheduleListPanel({
  list,
  level,
  counts,
  now,
}: {
  list: ScheduleList;
  /** The tahap chosen, or null for every tahap. */
  level: number | null;
  counts: CohortCount[];
  now: CampusMoment;
}) {
  return (
    <section className={shared.panel}>
      <div className={styles.panelHead}>
        <h2 className={shared.heading}>Jadwal dan kehadiran</h2>
        <StageChoices open={level} />
      </div>
      {list.matching === 0 ? (
        <p className={shared.empty}>Belum ada jadwal kegiatan.</p>
      ) : (
        <>
          <ScheduleTable schedules={list.schedules} counts={counts} now={now} />
          <ListPager
            page={list.page}
            matching={list.matching}
            noun="jadwal"
            addressOf={(page) => scheduleListAddress(level, page)}
          />
        </>
      )}
    </section>
  );
}
