import shared from "@/ui/data-screen.module.css";
import styles from "./activities.module.css";
import type { RundownLine } from "./activity-ids";
import type { ActivityRow } from "./activity-row";
import { audienceWords, organiserLine } from "./activity-words";
import type { AnnouncedAttendance } from "./announced-attendance";
import { AttendanceDetail } from "./attendance-detail";

/** Rincian kegiatan: each line its time, then what happens. */
export function Rundown({ lines }: { lines: RundownLine[] }) {
  if (lines.length === 0) {
    return <p className={shared.emptySection}>Belum ada rincian kegiatan.</p>;
  }
  return (
    <ol className={styles.rundown}>
      {lines.map((line, place) => (
        // Two lines may hold the same words, and their order never changes.
        // biome-ignore lint/suspicious/noArrayIndexKey: see the line above.
        <li key={place}>
          <b>{line.time}</b>
          <span>{line.activity}</span>
        </li>
      ))}
    </ol>
  );
}

/**
 * What "Rincian" opens: the penanggung jawab, the peserta with how many
 * they are, and Rincian kegiatan, and for an account that may see the
 * attendance what BAM announced of it.
 */
export function ActivityDetail({
  activity,
  participants,
  attendance,
}: {
  activity: ActivityRow;
  /** How many residents take part, among those the account may see. */
  participants: number;
  /**
   * The announced count of the activity on its day, undefined when there
   * is none, or null for an account that may not see the attendance.
   */
  attendance: AnnouncedAttendance | undefined | null;
}) {
  const count = participants.toLocaleString("id-ID");
  return (
    <div className={styles.detail}>
      <dl className={styles.facts}>
        <div>
          <dt>Penanggung jawab</dt>
          <dd>{organiserLine(activity.organiser, activity.organiserName)}</dd>
        </div>
        <div>
          <dt>Peserta</dt>
          <dd>
            {audienceWords(activity.audience)}, {count} mahasiswa
          </dd>
        </div>
      </dl>
      <Rundown lines={activity.rundown} />
      {attendance !== null && <AttendanceDetail attendance={attendance} />}
    </div>
  );
}
