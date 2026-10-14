import type { ReactNode } from "react";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import styles from "./activities.module.css";
import { OrganiserBadge } from "./activity-badges";
import type { ActivityRow } from "./activity-row";
import {
  audienceWords,
  CATEGORY_WORDS,
  hoursWords,
  PATTERN_WORDS,
  placeWords,
  repeatWords,
  validityWords,
} from "./activity-words";

function Pattern({ activity }: { activity: ActivityRow }) {
  if (activity.pattern === "once") return null;
  return (
    <>
      <span className={`${shared.badge} ${styles.plain}`}>
        {PATTERN_WORDS[activity.pattern]}
      </span>
      <span className={shared.detail}>{repeatWords(activity)}</span>
    </>
  );
}

function daysOffWords(daysOff: string[]): string {
  if (daysOff.length === 0) return "-";
  return daysOff.map(shownDay).join(", ");
}

function RoutineRow({
  activity,
  actions,
}: {
  activity: ActivityRow;
  actions: ReactNode;
}) {
  const detail = [
    CATEGORY_WORDS[activity.category],
    placeWords(activity.location),
    audienceWords(activity.audience),
  ].join(" · ");
  return (
    <tr>
      <td data-title="Kegiatan">
        <b>{activity.name}</b>
        <span className={shared.detail}>{detail}</span>
      </td>
      <td data-title="Pola">
        <Pattern activity={activity} />
      </td>
      <td data-title="Waktu">
        {hoursWords(activity.startTime, activity.endTime)}
      </td>
      <td data-title="Penanggung jawab">
        <OrganiserBadge organiser={activity.organiser} />
      </td>
      <td data-title="Berlaku">
        {validityWords(activity.startsOn, activity.endsOn)}
      </td>
      <td data-title="Hari tanpa kegiatan">{daysOffWords(activity.daysOff)}</td>
      <td>{actions}</td>
    </tr>
  );
}

/**
 * Kegiatan rutin: every repeating activity as it is now, a card each on
 * a phone. `actionsOf` gives the buttons of a row, for an account that
 * may change the activities.
 */
export function RoutinePanel({
  routines,
  actionsOf,
}: {
  routines: ActivityRow[];
  actionsOf: ((activity: ActivityRow) => ReactNode) | null;
}) {
  return (
    <section className={shared.panel}>
      <div className={styles.head}>
        <div>
          <h2 className={`${shared.heading} ${styles.title}`}>
            Kegiatan rutin
          </h2>
          <p className={styles.quietLine}>
            Kegiatan berulang harian, mingguan, atau bulanan. Jadwal harian
            dibentuk otomatis, kecuali pada hari yang ditandai tidak ada
            kegiatan.
          </p>
        </div>
      </div>
      {routines.length === 0 ? (
        <p className={shared.empty}>Belum ada kegiatan rutin.</p>
      ) : (
        <div className={shared.tableWrap}>
          <table className={`${shared.table} ${shared.stacked}`}>
            <thead>
              <tr>
                <th>Kegiatan</th>
                <th>Pola</th>
                <th>Waktu</th>
                <th>Penanggung jawab</th>
                <th>Berlaku</th>
                <th>Hari tanpa kegiatan</th>
                <th>
                  <span className={shared.hidden}>Tindakan</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {routines.map((activity) => (
                <RoutineRow
                  key={activity.id}
                  activity={activity}
                  actions={actionsOf?.(activity)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
