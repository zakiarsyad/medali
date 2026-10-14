import type { ReactNode } from "react";
import type { CampusMoment } from "@/academic-periods/campus-clock";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { ListPager } from "@/ui/list-pager";
import styles from "./activities.module.css";
import { OrganiserBadge, StateBadge } from "./activity-badges";
import type { OneOffPage } from "./activity-lists";
import type { ActivityRow } from "./activity-row";
import { activityState } from "./activity-state";
import {
  audienceWords,
  CATEGORY_WORDS,
  hoursWords,
  placeWords,
} from "./activity-words";

function OneOffRow({
  activity,
  now,
  actions,
}: {
  activity: ActivityRow;
  now: CampusMoment;
  actions: ReactNode;
}) {
  const { startsOn: day, startTime, endTime } = activity;
  const detail = [
    CATEGORY_WORDS[activity.category],
    placeWords(activity.location),
  ].join(" · ");
  return (
    <tr>
      <td data-title="Tanggal">{shownDay(day)}</td>
      <td data-title="Kegiatan">
        <b>{activity.name}</b>
        <span className={shared.detail}>{detail}</span>
      </td>
      <td data-title="Waktu">{hoursWords(startTime, endTime)}</td>
      <td data-title="Penanggung jawab">
        <OrganiserBadge organiser={activity.organiser} />
      </td>
      <td data-title="Peserta">{audienceWords(activity.audience)}</td>
      <td data-title="Status">
        <StateBadge state={activityState({ day, startTime, endTime }, now)} />
      </td>
      <td>{actions}</td>
    </tr>
  );
}

/**
 * Kegiatan non rutin: one page of the one-off activities, the latest
 * date first, a card each on a phone. `actionsOf` gives the buttons of a
 * row, for an account that may change the activities.
 */
export function OneOffPanel({
  list,
  now,
  addressOf,
  actionsOf,
}: {
  list: OneOffPage;
  now: CampusMoment;
  /** The address of a page of the list. */
  addressOf: (page: number) => string;
  actionsOf: ((activity: ActivityRow) => ReactNode) | null;
}) {
  return (
    <section className={shared.panel}>
      <div className={styles.head}>
        <div>
          <h2 className={`${shared.heading} ${styles.title}`}>
            Kegiatan non rutin
          </h2>
          <p className={styles.quietLine}>
            Kegiatan yang tidak berulang, diinput Pengelola Asrama per tanggal.
          </p>
        </div>
      </div>
      {list.matching === 0 ? (
        <p className={shared.empty}>Belum ada kegiatan non rutin.</p>
      ) : (
        <>
          <div className={shared.tableWrap}>
            <table className={`${shared.table} ${shared.stacked}`}>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Kegiatan</th>
                  <th>Waktu</th>
                  <th>Penanggung jawab</th>
                  <th>Peserta</th>
                  <th>Status</th>
                  <th>
                    <span className={shared.hidden}>Tindakan</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.activities.map((activity) => (
                  <OneOffRow
                    key={activity.id}
                    activity={activity}
                    now={now}
                    actions={actionsOf?.(activity)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <ListPager
            page={list.page}
            matching={list.matching}
            noun="kegiatan"
            addressOf={addressOf}
          />
        </>
      )}
    </section>
  );
}
