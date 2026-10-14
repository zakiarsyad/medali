import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import styles from "./activities.module.css";
import { OrganiserBadge, StateBadge } from "./activity-badges";
import type { Occurrence } from "./activity-days";
import { Rundown } from "./activity-detail";
import type { ActivityRow } from "./activity-row";
import { type ActivityState, activityState } from "./activity-state";
import { hoursWords, placeWords } from "./activity-words";
import { HistoryTable } from "./history-table";
import type { ResidentActivities } from "./resident-activities";
import type { OwnAttendance } from "./resident-attendance";
import { AttendanceNumbers } from "./resident-attendance-view";

function whenAndWhere(activity: ActivityRow): string {
  const hours = hoursWords(activity.startTime, activity.endTime);
  return `${hours} · ${placeWords(activity.location)}`;
}

/** One activity of today: when and where, its state, who leads it, and Rincian. */
function TodayCard({
  activity,
  state,
}: {
  activity: ActivityRow;
  state: ActivityState;
}) {
  return (
    <li className={styles.card}>
      <div className={styles.cardHead}>
        <div>
          <h3 className={styles.cardName}>{activity.name}</h3>
          <p className={styles.quietLine}>{whenAndWhere(activity)}</p>
        </div>
        <StateBadge state={state} />
      </div>
      <p className={styles.quietLine}>
        Penanggung jawab: <OrganiserBadge organiser={activity.organiser} />{" "}
        {activity.organiserName}
      </p>
      <Rundown lines={activity.rundown} />
    </li>
  );
}

function ComingItem({ occurrence }: { occurrence: Occurrence<ActivityRow> }) {
  const { activity } = occurrence;
  return (
    <li className={styles.comingItem}>
      <span className={shared.detail}>{shownDay(occurrence.day)}</span>
      <span>
        <b>{activity.name}</b> <OrganiserBadge organiser={activity.organiser} />
      </span>
      <span className={shared.detail}>{whenAndWhere(activity)}</span>
    </li>
  );
}

/**
 * Kegiatan asrama for a resident: "Hari ini" as cards, one column on a
 * phone, and "Akan datang" with the next activities. A resident who may
 * see their attendance sees how it is counted and its numbers above, and
 * Riwayat below.
 */
export function ResidentActivitiesView({
  activities,
  attendance,
}: {
  activities: ResidentActivities;
  /** The resident's attendance, or null when they may not see it. */
  attendance: OwnAttendance | null;
}) {
  const { now, today, coming } = activities;
  return (
    <>
      {attendance && (
        <AttendanceNumbers
          attendance={attendance}
          todayCount={today.length}
          dorm={activities.dorm}
        />
      )}
      <section className={styles.part}>
        <h2 className={shared.heading}>Hari ini</h2>
        {today.length === 0 ? (
          <div className={shared.panel}>
            <p className={shared.empty}>Tidak ada kegiatan hari ini.</p>
          </div>
        ) : (
          <ul className={styles.cards}>
            {today.map((activity) => (
              <TodayCard
                key={activity.id}
                activity={activity}
                state={activityState(
                  {
                    day: now.day,
                    startTime: activity.startTime,
                    endTime: activity.endTime,
                  },
                  now,
                )}
              />
            ))}
          </ul>
        )}
      </section>
      <section className={styles.part}>
        <h2 className={shared.heading}>Akan datang</h2>
        <div className={shared.panel}>
          {coming.length === 0 ? (
            <p className={shared.empty}>Belum ada jadwal.</p>
          ) : (
            <ul className={styles.comingList}>
              {coming.map((occurrence) => (
                <ComingItem
                  key={`${occurrence.day} ${occurrence.activity.id}`}
                  occurrence={occurrence}
                />
              ))}
            </ul>
          )}
        </div>
      </section>
      {attendance && (
        <section className={styles.part}>
          <h2 className={shared.heading}>Riwayat</h2>
          <div className={shared.panel}>
            <HistoryTable history={attendance.history} />
          </div>
        </section>
      )}
    </>
  );
}
