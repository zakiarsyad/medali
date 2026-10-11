"use client";

import { useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage } from "@/ui/form-message";
import styles from "./curriculum.module.css";
import type { ValueIndicators } from "./main-indicators";
import type { PpksActivity } from "./ppks-activities";
import { PpksForm } from "./ppks-form";
import { PpksTable } from "./ppks-table";

/** The PPKS activities of one semester, with the form to add one. */
export function PpksPanel({
  semester,
  note,
  activities,
  values,
  mayManage,
}: {
  semester: number;
  /** The tahap and the half of the year the semester belongs to. */
  note: string;
  activities: PpksActivity[];
  values: ValueIndicators[];
  mayManage: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  function startAdding() {
    setSaved(null);
    setAdding(true);
  }

  function showSaved(message: string) {
    setSaved(message);
    setAdding(false);
  }

  return (
    <section className={shared.panel}>
      <div className={styles.panelHead}>
        <div>
          <h2 className={shared.heading}>
            Program kegiatan PPKS semester {semester}
          </h2>
          <p className={shared.detail}>{note}</p>
        </div>
        {mayManage && !adding && (
          <button type="button" className={shared.button} onClick={startAdding}>
            Tambah kegiatan PPKS
          </button>
        )}
      </div>
      {saved && (
        <div className={styles.message}>
          <FormMessage state={{ error: null, done: saved }} />
        </div>
      )}
      {adding && (
        <PpksForm
          semester={semester}
          values={values}
          onSaved={showSaved}
          onCancel={() => setAdding(false)}
        />
      )}
      <PpksTable activities={activities} />
    </section>
  );
}
