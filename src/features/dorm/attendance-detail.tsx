import shared from "@/ui/data-screen.module.css";
import { shownMoment } from "@/ui/day";
import { toneBadge } from "@/ui/tone-badge";
import styles from "./activities.module.css";
import type {
  AnnouncedAttendance,
  MarkedParticipant,
  PresenceStatus,
} from "./announced-attendance";

/** Hadir, Tidak hadir in the look of an absence, or Izin. */
export function PresenceBadge({ status }: { status: PresenceStatus }) {
  if (status === "leave") {
    return <span className={toneBadge("plain")}>Izin</span>;
  }
  if (status === "present") {
    return <span className={toneBadge("good")}>Hadir</span>;
  }
  return <span className={toneBadge("bad")}>Tidak hadir</span>;
}

function MarkedList({ marked }: { marked: MarkedParticipant[] }) {
  if (marked.length === 0) {
    return (
      <p className={styles.quietLine}>Semua peserta hadir tanpa catatan.</p>
    );
  }
  return (
    <ul className={styles.markedList}>
      {marked.map((row) => (
        <li key={row.studentId} className={styles.markedRow}>
          <span className={styles.countWho}>
            <b>{row.name}</b>
            <span className={shared.detail}>{row.nim}</span>
          </span>
          <PresenceBadge status={row.status} />
          <span className={styles.markedNote}>{row.note || "-"}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * What Rincian shows of the attendance: whether BAM announced it, when
 * and by whom, the Ringkasan, and who was absent or has a note. A count
 * that is not announced shows only that.
 */
export function AttendanceDetail({
  attendance,
}: {
  attendance: AnnouncedAttendance | undefined;
}) {
  if (!attendance) {
    return (
      <dl className={styles.facts}>
        <div>
          <dt>Pengumuman BAM</dt>
          <dd>Belum diumumkan</dd>
        </div>
      </dl>
    );
  }
  const { present, absent } = attendance;
  const when = shownMoment(attendance.announcedAt);
  return (
    <>
      <dl className={styles.facts}>
        <div>
          <dt>Pengumuman BAM</dt>
          <dd>
            Sudah diumumkan {when} oleh {attendance.announcedBy}
          </dd>
        </div>
        <div>
          <dt>Ringkasan</dt>
          <dd>
            {present.toLocaleString("id-ID")} hadir ·{" "}
            {absent.toLocaleString("id-ID")} tidak hadir
          </dd>
        </div>
      </dl>
      <MarkedList marked={attendance.marked} />
    </>
  );
}
