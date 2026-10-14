"use client";

import type { CampusMoment } from "@/academic-periods/campus-clock";
import styles from "./activities.module.css";
import type { ActivitiesParams } from "./activities-address";
import { activitiesAddress } from "./activities-address";
import type { ActivitiesView } from "./activities-view";
import { DailyPanel } from "./daily-panel";
import { OneOffPanel } from "./one-off-panel";
import { RoutinePanel } from "./routine-panel";
import { ViewSwitch } from "./view-switch";

/** The list the address asks for. */
function OpenList({
  view,
  params,
  now,
}: {
  view: ActivitiesView;
  params: ActivitiesParams;
  now: CampusMoment;
}) {
  if (view.view === "rutin") {
    return <RoutinePanel routines={view.routines} actionsOf={null} />;
  }
  if (view.view === "nonrutin") {
    return (
      <OneOffPanel
        list={view.list}
        now={now}
        addressOf={(page) => activitiesAddress({ ...params, page }, now.day)}
        actionsOf={null}
      />
    );
  }
  return (
    <DailyPanel
      day={view.day}
      activities={view.activities}
      residents={view.residents}
      now={now}
      actionsOf={null}
    />
  );
}

/**
 * Kegiatan asrama for staff: the switch between the three lists, and the
 * list that is open.
 */
export function ActivityBoard({
  params,
  view,
  now,
}: {
  params: ActivitiesParams;
  view: ActivitiesView;
  /** The moment on campus the states are told at. */
  now: CampusMoment;
}) {
  return (
    <>
      <div className={styles.toolbar}>
        <ViewSwitch params={params} today={now.day} />
      </div>
      <OpenList view={view} params={params} now={now} />
    </>
  );
}
