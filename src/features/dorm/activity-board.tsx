"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import type { CampusMoment } from "@/academic-periods/campus-clock";
import shared from "@/ui/data-screen.module.css";
import { FormMessage } from "@/ui/form-message";
import styles from "./activities.module.css";
import { type ActivitiesParams, activitiesAddress } from "./activities-address";
import type { ActivitiesView } from "./activities-view";
import {
  DayOffButton,
  RemoveActivityButton,
  RestoreActivityButton,
} from "./activity-buttons";
import { ActivityForm, type FormTarget } from "./activity-form";
import {
  type ActivityRow,
  isRoutine,
  mayChange,
  mayMarkDayOff,
} from "./activity-row";
import { dayWords } from "./activity-words";
import { LEAVE_QUESTION } from "./count-form";
import { CountPanel } from "./count-panel";
import { DailyPanel } from "./daily-panel";
import { OneOffPanel } from "./one-off-panel";
import { RoutinePanel } from "./routine-panel";
import { ViewSwitch } from "./view-switch";

/** What the form needs, for an account that may change the activities. */
export interface FormParts {
  /** The key the next activity a form adds is kept under. */
  newActivityId: string;
}

type ActionsOf = ((activity: ActivityRow) => ReactNode) | null;

/** What the board says after a change. */
interface Said {
  text: string;
  /** The activity "Urungkan" brings back, after a removal only. */
  removedId: string | null;
}

/** The list the address asks for. */
function OpenList({
  view,
  params,
  now,
  actionsOf,
  leaveQuestion,
}: {
  view: ActivitiesView;
  params: ActivitiesParams;
  now: CampusMoment;
  actionsOf: ActionsOf;
  /** What is asked before another day opens, or null to ask nothing. */
  leaveQuestion: string | null;
}) {
  if (view.view === "rutin") {
    return <RoutinePanel routines={view.routines} actionsOf={actionsOf} />;
  }
  if (view.view === "nonrutin") {
    return (
      <OneOffPanel
        list={view.list}
        now={now}
        addressOf={(page) => activitiesAddress({ ...params, page }, now.day)}
        actionsOf={actionsOf}
      />
    );
  }
  return (
    <DailyPanel
      day={view.day}
      activities={view.activities}
      residents={view.residents}
      now={now}
      actionsOf={actionsOf}
      leaveQuestion={leaveQuestion}
    />
  );
}

function AddButtons({ onAdd }: { onAdd: (isRoutine: boolean) => void }) {
  return (
    <div className={shared.actions}>
      <button
        type="button"
        className={shared.quiet}
        onClick={() => onAdd(true)}
      >
        Tambah kegiatan rutin
      </button>
      <button
        type="button"
        className={shared.button}
        onClick={() => onAdd(false)}
      >
        Tambah kegiatan non rutin
      </button>
    </div>
  );
}

/**
 * Kegiatan asrama for staff: the switch between the three lists, the
 * list that is open, and for an account that may change the activities
 * the buttons that add one and the form, above the list. It holds what
 * the form is open for, as "Ubah" in a list opens the form, and only one
 * form is open at a time.
 */
export function ActivityBoard({
  params,
  view,
  now,
  form,
}: {
  params: ActivitiesParams;
  view: ActivitiesView;
  /** The moment on campus the states are told at. */
  now: CampusMoment;
  /** What the form needs, or null for an account that only reads. */
  form: FormParts | null;
}) {
  const [target, setTarget] = useState<FormTarget | null>(null);
  const [said, setSaid] = useState<Said | null>(null);
  const [isCountUnsaved, setCountUnsaved] = useState(false);
  const panel = useRef<HTMLElement>(null);
  // "Tiada kegiatan" is for one day, so only Jadwal harian offers it.
  const dayShown = view.view === "harian" ? view.day : null;

  // The form is above the list, so "Ubah" far down brings it into view.
  useEffect(() => {
    if (target?.activity) panel.current?.scrollIntoView({ behavior: "smooth" });
  }, [target]);

  function openFor(opened: FormTarget) {
    setSaid(null);
    setTarget(opened);
  }

  function closeWith(text: string, removedId: string | null = null) {
    setSaid({ text, removedId });
    setTarget(null);
  }

  function rowActions(activity: ActivityRow): ReactNode {
    const change = () => openFor({ isRoutine: isRoutine(activity), activity });
    return (
      <>
        {mayChange(activity, now.day) && (
          <button type="button" className={shared.link} onClick={change}>
            Ubah
          </button>
        )}
        {dayShown !== null && mayMarkDayOff(activity) && (
          <DayOffButton
            id={activity.id}
            day={dayShown}
            question={`Tandai ${dayWords(dayShown)} tidak ada ${activity.name.toLowerCase()}?`}
            onDone={(text) => closeWith(text)}
          />
        )}
      </>
    );
  }

  const removing = target?.activity;
  return (
    <>
      <div className={styles.toolbar}>
        <ViewSwitch params={params} today={now.day} />
        {form && !target && (
          <AddButtons
            onAdd={(isRoutine) => openFor({ isRoutine, activity: null })}
          />
        )}
      </div>
      {said && (
        <div className={styles.message}>
          <FormMessage state={{ error: null, done: said.text }} />
          {said.removedId && (
            <RestoreActivityButton
              id={said.removedId}
              onRestored={(text) => closeWith(text)}
            />
          )}
        </div>
      )}
      {form && target && (
        <section className={`${shared.panel} ${styles.formPanel}`} ref={panel}>
          <ActivityForm
            // Made anew for each activity and each of its versions, so its
            // fields hold what that one has.
            key={
              target.activity
                ? target.activity.id + target.activity.version
                : String(target.isRoutine)
            }
            target={target}
            newActivityId={form.newActivityId}
            day={params.day}
            today={now.day}
            onSaved={(text) => closeWith(text)}
            onCancel={() => setTarget(null)}
            removal={
              removing &&
              mayChange(removing, now.day) && (
                <RemoveActivityButton
                  id={removing.id}
                  onRemoved={(text) => closeWith(text, removing.id)}
                />
              )
            }
          />
        </section>
      )}
      <OpenList
        view={view}
        params={params}
        now={now}
        actionsOf={form ? rowActions : null}
        leaveQuestion={isCountUnsaved ? LEAVE_QUESTION : null}
      />
      {view.view === "harian" && view.count && (
        <CountPanel
          activities={view.activities}
          view={view.count}
          params={params}
          today={now.day}
          onUnsaved={setCountUnsaved}
        />
      )}
    </>
  );
}
