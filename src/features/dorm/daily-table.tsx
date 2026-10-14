import { Fragment, type ReactNode, useState } from "react";
import type { CampusMoment } from "@/academic-periods/campus-clock";
import shared from "@/ui/data-screen.module.css";
import { countAudience, type ResidentsByDorm } from "./activity-audience";
import { KindBadge, OrganiserBadge, StateBadge } from "./activity-badges";
import { ActivityDetail } from "./activity-detail";
import { type ActivityRow, isRoutine } from "./activity-row";
import { activityState } from "./activity-state";
import {
  audienceWords,
  CATEGORY_WORDS,
  hoursWords,
  placeWords,
  repeatWords,
} from "./activity-words";

/** The cells of a row, and the one with its buttons, count as columns. */
const COLUMNS = 6;

/** The pattern of a repeating one, the Kategori, the place, and "tidak wajib". */
function kindDetail(activity: ActivityRow): string {
  const parts = [
    CATEGORY_WORDS[activity.category],
    placeWords(activity.location),
  ];
  if (isRoutine(activity)) parts.unshift(repeatWords(activity));
  if (!activity.isRequired) parts.push("tidak wajib");
  return parts.join(" · ");
}

function ActivityCells({
  activity,
  day,
  now,
  participants,
}: {
  activity: ActivityRow;
  day: string;
  now: CampusMoment;
  participants: number;
}) {
  const { startTime, endTime } = activity;
  const state = activityState({ day, startTime, endTime }, now);
  return (
    <>
      <td data-title="Waktu">{hoursWords(startTime, endTime)}</td>
      <td data-title="Kegiatan">
        <b>{activity.name}</b> <KindBadge isRoutine={isRoutine(activity)} />
        <span className={shared.detail}>{kindDetail(activity)}</span>
      </td>
      <td data-title="Penanggung jawab">
        <OrganiserBadge organiser={activity.organiser} />
        <span className={shared.detail}>{activity.organiserName}</span>
      </td>
      <td data-title="Peserta">
        {audienceWords(activity.audience)} (
        {participants.toLocaleString("id-ID")})
      </td>
      <td data-title="Status">
        <StateBadge state={state} />
      </td>
    </>
  );
}

/**
 * The activities of one day: a table, and a card each on a phone. Each
 * has "Rincian", which opens what it holds under it, and "Tutup" closes
 * it again. `actionsOf` gives the other buttons of a row, for an account
 * that may change the activities.
 */
export function DailyTable({
  activities,
  day,
  now,
  residents,
  actionsOf,
}: {
  activities: ActivityRow[];
  day: string;
  /** The moment on campus the states are told at. */
  now: CampusMoment;
  /** The residents of each dorm the account may see, to count Peserta. */
  residents: ResidentsByDorm;
  actionsOf: ((activity: ActivityRow) => ReactNode) | null;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Waktu</th>
            <th>Kegiatan</th>
            <th>Penanggung jawab</th>
            <th>Peserta</th>
            <th>Status</th>
            <th>
              <span className={shared.hidden}>Tindakan</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity) => {
            const isOpen = openId === activity.id;
            const participants = countAudience(residents, activity.audience);
            return (
              <Fragment key={activity.id}>
                <tr>
                  <ActivityCells
                    activity={activity}
                    day={day}
                    now={now}
                    participants={participants}
                  />
                  <td>
                    <span className={shared.rowActions}>
                      <button
                        type="button"
                        className={shared.link}
                        aria-expanded={isOpen}
                        onClick={() => setOpenId(isOpen ? null : activity.id)}
                      >
                        {isOpen ? "Tutup" : "Rincian"}
                      </button>
                      {actionsOf?.(activity)}
                    </span>
                  </td>
                </tr>
                {isOpen && (
                  <tr>
                    <td colSpan={COLUMNS}>
                      <ActivityDetail
                        activity={activity}
                        participants={participants}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
