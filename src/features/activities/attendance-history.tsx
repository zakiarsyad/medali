import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import styles from "./activities.module.css";
import { HISTORY_LOOKS } from "./badge-look";
import { historyAddress } from "./history-address";
import { HISTORY_WORDS, historyStatus } from "./history-status";
import { LookBadge } from "./look-badge";
import { shownDays } from "./schedule-words";
import { lastUploadDay } from "./student-activity-words";
import type { StudentSchedule } from "./student-schedule";
import { HISTORY_PAGE_SIZE, type ScheduleHistory } from "./student-schedules";

function HistoryCells({
  schedule,
  today,
}: {
  schedule: StudentSchedule;
  today: string;
}) {
  const { attendance } = schedule;
  const status = historyStatus(attendance?.status ?? null, schedule, today);
  return (
    <>
      <td data-title="Tanggal">
        {shownDays(schedule.startsOn, schedule.endsOn)}
      </td>
      <td data-title="Kegiatan">
        {schedule.name}
        {!schedule.isRequired && (
          <span className={shared.detail}>(tidak wajib)</span>
        )}
      </td>
      <td data-title="Status">
        <LookBadge words={HISTORY_WORDS[status]} look={HISTORY_LOOKS[status]} />
        {status === "not_sent" && (
          <span className={shared.detail}>
            sampai {lastUploadDay(schedule)}
          </span>
        )}
      </td>
      <td data-title="Keterangan">{attendance?.note ?? ""}</td>
    </>
  );
}

/**
 * "Riwayat kehadiran": the schedules whose last day is over, the newest
 * first, each with where the student's attendance stands. A table, and
 * cards on a phone.
 */
export function AttendanceHistory({
  history,
  today,
}: {
  history: ScheduleHistory;
  /** The day on campus the statuses are told on. */
  today: string;
}) {
  return (
    <section className={styles.part}>
      <h2 className={shared.heading}>Riwayat kehadiran</h2>
      <div className={shared.panel}>
        {history.matching === 0 ? (
          <p className={shared.empty}>Belum ada riwayat.</p>
        ) : (
          <>
            <div className={shared.tableWrap}>
              <table className={`${shared.table} ${shared.stacked}`}>
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Kegiatan</th>
                    <th>Status</th>
                    <th>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {history.schedules.map((schedule) => (
                    <tr key={schedule.id}>
                      <HistoryCells schedule={schedule} today={today} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ListPager
              page={history.page}
              matching={history.matching}
              pageSize={HISTORY_PAGE_SIZE}
              noun="kegiatan"
              addressOf={historyAddress}
            />
          </>
        )}
      </div>
    </section>
  );
}
