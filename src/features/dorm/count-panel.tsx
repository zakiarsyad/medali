import Link from "next/link";
import shared from "@/ui/data-screen.module.css";
import styles from "./activities.module.css";
import { type ActivitiesParams, activitiesAddress } from "./activities-address";
import type { ActivityRow } from "./activity-row";
import { CountForm } from "./count-form";
import { NOT_STARTED_WORDS } from "./count-messages";
import type { CountPanelView } from "./count-view";

/** One chip for each activity of the day, the one counted marked. */
function ActivityChips({
  activities,
  chosenId,
  params,
  today,
}: {
  activities: ActivityRow[];
  chosenId: string;
  params: ActivitiesParams;
  today: string;
}) {
  return (
    <nav aria-label="Kegiatan yang dihitung">
      <ul className={styles.chips}>
        {activities.map((activity) => (
          <li key={activity.id}>
            <Link
              href={activitiesAddress(
                { ...params, view: "harian", counted: activity.id },
                today,
              )}
              className={styles.choice}
              aria-current={activity.id === chosenId ? "true" : undefined}
              scroll={false}
            >
              {activity.startTime} · {activity.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * "Penghitungan kehadiran" under Jadwal harian, for an account that may
 * count: a chip for each activity of the day, and the count of the one
 * chosen once it has started.
 */
export function CountPanel({
  activities,
  view,
  params,
  today,
  ownStudentId,
  onUnsaved,
}: {
  activities: ActivityRow[];
  view: CountPanelView;
  params: ActivitiesParams;
  today: string;
  /** The student the account belongs to, whose own row it does not mark. */
  ownStudentId: string | null;
  onUnsaved: (isUnsaved: boolean) => void;
}) {
  const { activity } = view;
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>Penghitungan kehadiran</h2>
      <p className={styles.quietLine}>
        Badan Asrama Mahasiswa menghitung kehadiran di tempat kegiatan, menandai
        yang tidak hadir, lalu mengumumkannya setelah kegiatan.
      </p>
      <ActivityChips
        activities={activities}
        chosenId={activity.id}
        params={params}
        today={today}
      />
      {view.kind === "not_started" ? (
        <p className={styles.warnNote}>{NOT_STARTED_WORDS}</p>
      ) : (
        <CountForm
          // Made anew for each activity and day, so its rows hold their count.
          key={`${activity.id} ${params.day}`}
          activity={activity}
          day={params.day}
          participants={view.participants}
          kept={view.kept}
          onLeave={view.onLeave}
          ownStudentId={ownStudentId}
          onUnsaved={onUnsaved}
        />
      )}
    </section>
  );
}
