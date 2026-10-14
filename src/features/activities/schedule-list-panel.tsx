import type { CampusMoment } from "@/academic-periods/campus-clock";
import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import styles from "./activities.module.css";
import type { ScheduleList } from "./list-schedules";
import type { CohortCount } from "./participants";
import type { ListAttendance } from "./schedule-attendance";
import {
  type ScheduleScope,
  scheduleListAddress,
} from "./schedule-list-address";
import type { ScheduleRow } from "./schedule-row";
import { ScheduleTable } from "./schedule-table";
import { StageChoices } from "./stage-choices";

/**
 * "Jadwal dan kehadiran": the schedules of a scope and their pages, with
 * the tahap choice above those of the PPKS activities.
 */
export function ScheduleListPanel({
  list,
  scope,
  counts,
  now,
  attendance,
  onChange,
}: {
  list: ScheduleList;
  scope: ScheduleScope;
  counts: CohortCount[];
  now: CampusMoment;
  attendance: ListAttendance;
  /** Opens the form of a schedule, or null for an account that only reads. */
  onChange: ((schedule: ScheduleRow) => void) | null;
}) {
  return (
    <section className={shared.panel}>
      <div className={styles.panelHead}>
        <h2 className={shared.heading}>Jadwal dan kehadiran</h2>
        {scope.kind === "ppks" && <StageChoices open={scope.level} />}
      </div>
      {list.matching === 0 ? (
        <p className={shared.empty}>Belum ada jadwal kegiatan.</p>
      ) : (
        <>
          <ScheduleTable
            schedules={list.schedules}
            counts={counts}
            now={now}
            attendance={attendance}
            addressOf={(open) => scheduleListAddress(scope, list.page, open)}
            onChange={onChange}
          />
          <ListPager
            page={list.page}
            matching={list.matching}
            noun="jadwal"
            addressOf={(page) => scheduleListAddress(scope, page)}
          />
        </>
      )}
    </section>
  );
}
