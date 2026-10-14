import { Fragment, type ReactNode, useState } from "react";
import type { CampusMoment } from "@/academic-periods/campus-clock";
import shared from "@/ui/data-screen.module.css";
import styles from "./activities.module.css";
import { countAudience, type ResidentsByDorm } from "./activity-audience";
import { KindBadge, OrganiserBadge, StateBadge } from "./activity-badges";
import { ActivityDetail } from "./activity-detail";
import { type ActivityRow, isRoutine } from "./activity-row";
import { type ActivityState, activityState } from "./activity-state";
import {
  audienceWords,
  CATEGORY_WORDS,
  hoursWords,
  placeWords,
  repeatWords,
} from "./activity-words";
import type {
  AnnouncedAttendance,
  DayAttendance,
} from "./announced-attendance";
import { attendanceRate, rateWords } from "./attendance-rate";

/** The cells of a row, and the one with its buttons, count as columns. */
const COLUMNS = 6;
/** Hadir and Kehadiran, for an account that may see the attendance. */
const ATTENDANCE_COLUMNS = 2;

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

/**
 * Hadir and Kehadiran: the numbers of an announced count, "Belum
 * diumumkan" for an activity that is over without one, and a dash before
 * that.
 */
function AttendanceCells({
  attendance,
  state,
}: {
  attendance: AnnouncedAttendance | undefined;
  state: ActivityState;
}) {
  if (attendance) {
    const { present, absent } = attendance;
    const rate = attendanceRate(present, present + absent);
    return (
      <>
        <td data-title="Hadir">{present.toLocaleString("id-ID")}</td>
        <td data-title="Kehadiran">
          <b>{rateWords(rate)}</b>
        </td>
      </>
    );
  }
  return (
    <>
      <td data-title="Hadir">-</td>
      <td data-title="Kehadiran">
        {state === "over" ? (
          <span className={`${shared.badge} ${styles.warn}`}>
            Belum diumumkan
          </span>
        ) : (
          "-"
        )}
      </td>
    </>
  );
}

function ActivityCells({
  activity,
  state,
  participants,
}: {
  activity: ActivityRow;
  state: ActivityState;
  participants: number;
}) {
  const { startTime, endTime } = activity;
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
 * that may change the activities. An account that may see the attendance
 * sees Hadir and Kehadiran of each activity too.
 */
export function DailyTable({
  activities,
  day,
  now,
  residents,
  attendance,
  actionsOf,
}: {
  activities: ActivityRow[];
  day: string;
  /** The moment on campus the states are told at. */
  now: CampusMoment;
  /** The residents of each dorm the account may see, to count Peserta. */
  residents: ResidentsByDorm;
  /** The announced counts of the day, or null for an account without the right. */
  attendance: DayAttendance | null;
  actionsOf: ((activity: ActivityRow) => ReactNode) | null;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const columns = COLUMNS + (attendance ? ATTENDANCE_COLUMNS : 0);
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
            {attendance && (
              <>
                <th>Hadir</th>
                <th>Kehadiran</th>
              </>
            )}
            <th>
              <span className={shared.hidden}>Tindakan</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity) => {
            const isOpen = openId === activity.id;
            const participants = countAudience(residents, activity.audience);
            const { startTime, endTime } = activity;
            const state = activityState({ day, startTime, endTime }, now);
            const announced = attendance?.[activity.id];
            return (
              <Fragment key={activity.id}>
                <tr>
                  <ActivityCells
                    activity={activity}
                    state={state}
                    participants={participants}
                  />
                  {attendance && (
                    <AttendanceCells attendance={announced} state={state} />
                  )}
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
                    <td colSpan={columns}>
                      <ActivityDetail
                        activity={activity}
                        participants={participants}
                        attendance={attendance ? announced : null}
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
