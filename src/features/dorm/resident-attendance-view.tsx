import { DORM_NAMES, type DormId } from "@/dorms/dorms";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { NumberCard, NumberCards } from "@/ui/number-cards";
import styles from "./activities.module.css";
import { attendanceRate, rateWords } from "./attendance-rate";
import {
  HISTORY_STATUS_WORDS,
  type HistoryEntry,
  type HistoryStatus,
  heldKey,
} from "./history";
import type { OwnAttendance } from "./resident-attendance";

const STATUS_STYLES: Record<HistoryStatus, string | undefined> = {
  present: styles.ok,
  absent: styles.bad,
  not_announced: styles.warn,
};

/** The note on how attendance is counted, and the numbers under it. */
export function AttendanceNumbers({
  attendance,
  todayCount,
  dorm,
}: {
  attendance: OwnAttendance;
  /** How many activities the resident has today. */
  todayCount: number;
  dorm: DormId;
}) {
  const { present, absent } = attendance;
  const announced = present + absent;
  const rate = attendanceRate(present, announced) ?? 0;
  return (
    <>
      <p className={styles.note}>
        Kehadiran kegiatan asrama dihitung langsung di tempat kegiatan oleh
        Badan Asrama Mahasiswa. Setelah kegiatan, BAM mengumumkan
        ketidakhadiran. Kegiatan yang belum diumumkan belum dihitung.
      </p>
      <NumberCards>
        <NumberCard
          label="Kehadiran kegiatan asrama"
          amount={rateWords(rate)}
          note={`${present.toLocaleString("id-ID")} hadir dari ${announced.toLocaleString("id-ID")} kegiatan yang diumumkan`}
        />
        <NumberCard
          label="Tercatat tidak hadir"
          amount={absent}
          note="dari kegiatan yang diumumkan"
        />
        <NumberCard
          label="Kegiatan hari ini"
          amount={todayCount}
          note={DORM_NAMES[dorm]}
        />
      </NumberCards>
    </>
  );
}

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  return (
    <tr>
      <td data-title="Tanggal">
        {shownDay(entry.day)}{" "}
        <span className={shared.detail}>{entry.startTime}</span>
      </td>
      <td data-title="Kegiatan">{entry.name}</td>
      <td data-title="Status">
        <span className={`${shared.badge} ${STATUS_STYLES[entry.status]}`}>
          {HISTORY_STATUS_WORDS[entry.status]}
        </span>
      </td>
      <td data-title="Catatan">{entry.note || "-"}</td>
    </tr>
  );
}

/** Riwayat: the last activities that are over, with what was announced. */
export function HistoryTable({ history }: { history: HistoryEntry[] }) {
  if (history.length === 0) {
    return <p className={shared.empty}>Belum ada riwayat.</p>;
  }
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Kegiatan</th>
            <th>Status</th>
            <th>Catatan</th>
          </tr>
        </thead>
        <tbody>
          {history.map((entry) => (
            <HistoryRow key={heldKey(entry)} entry={entry} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
