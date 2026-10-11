"use client";

import { useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage } from "@/ui/form-message";
import styles from "./curriculum.module.css";
import type { ValueIndicators } from "./main-indicators";
import type { PpksActivity } from "./ppks-activities";
import { PpksForm } from "./ppks-form";
import { PpksTable } from "./ppks-table";

/** What the form is open for: a new activity, or one to change. */
type Open = "new" | PpksActivity | null;

/** The PPKS activities of one semester, with the form to add or change one. */
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
  const [open, setOpen] = useState<Open>(null);
  const [saved, setSaved] = useState<string | null>(null);

  function openFor(target: Open) {
    setSaved(null);
    setOpen(target);
  }

  function showSaved(message: string) {
    setSaved(message);
    setOpen(null);
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
        {mayManage && !open && (
          <button
            type="button"
            className={shared.button}
            onClick={() => openFor("new")}
          >
            Tambah kegiatan PPKS
          </button>
        )}
      </div>
      {saved && (
        <div className={styles.message}>
          <FormMessage state={{ error: null, done: saved }} />
        </div>
      )}
      {open && (
        <PpksForm
          key={open === "new" ? "new" : open.id}
          semester={semester}
          activity={open === "new" ? null : open}
          values={values}
          onSaved={showSaved}
          onCancel={() => setOpen(null)}
        />
      )}
      <PpksTable
        activities={activities}
        onChange={mayManage ? openFor : null}
      />
    </section>
  );
}
