"use client";

import { useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage } from "@/ui/form-message";
import styles from "./activities.module.css";
import type { FormParts } from "./form-values";
import type { ScheduleList } from "./list-schedules";
import type { CohortCount } from "./participants";
import { ScheduleForm } from "./schedule-form";
import { ScheduleListPanel } from "./schedule-list-panel";
import type { CampusMoment } from "./schedule-status";

/**
 * The panel "Jadwalkan kegiatan" with its form, for an account that may
 * manage activities, and under it the list of schedules. It holds whether
 * the form is open, as the panel and the list both need to know.
 */
export function ScheduleBoard({
  list,
  level,
  counts,
  now,
  form,
}: {
  list: ScheduleList;
  /** The tahap chosen, or null for every tahap. */
  level: number | null;
  counts: CohortCount[];
  now: CampusMoment;
  /** What the form needs, or null for an account that only reads. */
  form: FormParts | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [said, setSaid] = useState<string | null>(null);

  function open() {
    setSaid(null);
    setIsOpen(true);
  }

  function closeWith(message: string) {
    setSaid(message);
    setIsOpen(false);
  }

  return (
    <>
      {form && (
        <section className={shared.panel}>
          {isOpen ? (
            <ScheduleForm
              parts={form}
              onSaved={closeWith}
              onCancel={() => setIsOpen(false)}
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
              <button type="button" className={shared.button} onClick={open}>
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
      <ScheduleListPanel list={list} level={level} counts={counts} now={now} />
    </>
  );
}
