import styles from "./activities.module.css";
import type { RundownLine } from "./activity-ids";
import type { ActivityRow } from "./activity-row";
import { audienceWords, organiserLine } from "./activity-words";

/** Rincian kegiatan: each line its time, then what happens. */
export function Rundown({ lines }: { lines: RundownLine[] }) {
  if (lines.length === 0) {
    return <p className={styles.quietLine}>Belum ada rincian kegiatan.</p>;
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
 * they are, and Rincian kegiatan.
 */
export function ActivityDetail({
  activity,
  participants,
}: {
  activity: ActivityRow;
  /** How many residents take part, among those the account may see. */
  participants: number;
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
    </div>
  );
}
