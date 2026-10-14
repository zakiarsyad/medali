import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import styles from "./activities.module.css";
import {
  CLARIFICATION_DAYS,
  type ShownClarification,
} from "./clarification-time";
import { historyAddress } from "./history-address";
import { historyRowOf } from "./history-row";
import { HistoryTable } from "./history-table";
import { HISTORY_PAGE_SIZE, type ScheduleHistory } from "./student-schedules";

const HOW_TO_CLARIFY = `Tercatat tidak hadir padahal punya alasan? Ajukan klarifikasi dengan lampiran paling lambat ${CLARIFICATION_DAYS} hari setelah masa unggah foto berakhir. Klarifikasi diperiksa Penilai Mahasiswa.`;

/**
 * "Riwayat kehadiran": the schedules whose last day is over, the newest
 * first, each with where the student's attendance stands and what they
 * asked to have clarified, and under them how a clarification is asked.
 */
export function AttendanceHistory({
  history,
  clarifications,
  today,
}: {
  history: ScheduleHistory;
  /** The student's newest clarification for a schedule, by its key. */
  clarifications: Record<string, ShownClarification>;
  /** The day on campus the statuses are told on. */
  today: string;
}) {
  const rows = history.schedules.map((schedule) =>
    historyRowOf(schedule, today, clarifications[schedule.id] ?? null),
  );
  return (
    <section className={styles.part}>
      <h2 className={shared.heading}>Riwayat kehadiran</h2>
      <div className={shared.panel}>
        {history.matching === 0 ? (
          <p className={shared.empty}>Belum ada riwayat.</p>
        ) : (
          <>
            <HistoryTable rows={rows} />
            <p className={`${styles.cardText} ${styles.message}`}>
              {HOW_TO_CLARIFY}
            </p>
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
