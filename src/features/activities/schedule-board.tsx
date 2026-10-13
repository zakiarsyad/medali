"use client";

import { useRef, useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage } from "@/ui/form-message";
import styles from "./activities.module.css";
import type { FormParts } from "./form-values";
import type { ScheduleList } from "./list-schedules";
import type { CohortCount } from "./participants";
import type { ListAttendance } from "./schedule-attendance";
import { ScheduleForm } from "./schedule-form";
import { ScheduleListPanel } from "./schedule-list-panel";
import type { ScheduleRow } from "./schedule-row";
import type { CampusMoment } from "./schedule-status";

/** What the form is open for: a new schedule, or one to change. */
type FormTarget = "new" | ScheduleRow;

/**
 * The panel "Jadwalkan kegiatan" with its form, for an account that may
 * manage activities, and under it the list of schedules. It holds what
 * the form is open for, as "Ubah" in the list opens the form in the
 * panel, and only one form is open at a time.
 */
export function ScheduleBoard({
  list,
  level,
  counts,
  now,
  attendance,
  form,
}: {
  list: ScheduleList;
  /** The tahap chosen, or null for every tahap. */
  level: number | null;
  counts: CohortCount[];
  now: CampusMoment;
  attendance: ListAttendance;
  /** What the form needs, or null for an account that only reads. */
  form: FormParts | null;
}) {
  const [target, setTarget] = useState<FormTarget | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  const panel = useRef<HTMLElement>(null);

  function openFor(opened: FormTarget) {
    setSaid(null);
    setTarget(opened);
  }

  /** The form is above the list, so "Ubah" far down brings it into view. */
  function change(schedule: ScheduleRow) {
    openFor(schedule);
    panel.current?.scrollIntoView({ behavior: "smooth" });
  }

  function closeWith(message: string) {
    setSaid(message);
    setTarget(null);
  }

  return (
    <>
      {form && (
        <section className={`${shared.panel} ${styles.formPanel}`} ref={panel}>
          {target ? (
            <ScheduleForm
              // Made anew for each schedule and each of its versions, so
              // its fields hold what that one has.
              key={target === "new" ? "new" : target.id + target.version}
              schedule={target === "new" ? null : target}
              parts={form}
              onSaved={closeWith}
              onRemoved={closeWith}
              onCancel={() => setTarget(null)}
            />
          ) : (
            <div className={styles.addHead}>
              <div>
                <h2 className={shared.heading}>Jadwalkan kegiatan</h2>
                <p className={shared.detail}>
                  Pilih kegiatan dari daftar Kurikulum, lalu atur rentang
                  tanggal dan jam.
                </p>
              </div>
              <button
                type="button"
                className={shared.button}
                onClick={() => openFor("new")}
              >
                Jadwalkan kegiatan PPKS
              </button>
            </div>
          )}
          {said && (
            <div className={styles.message}>
              <FormMessage state={{ error: null, done: said }} />
            </div>
          )}
        </section>
      )}
      <ScheduleListPanel
        list={list}
        level={level}
        counts={counts}
        now={now}
        attendance={attendance}
        onChange={form ? change : null}
      />
    </>
  );
}
