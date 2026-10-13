"use client";

import { useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage } from "@/ui/form-message";
import styles from "./curriculum.module.css";
import type { ValueIndicators } from "./main-indicators";
import { type PpksActivity, wordsOf } from "./ppks-activities";
import { PpksForm } from "./ppks-form";
import { PpksTable } from "./ppks-table";

/** What the form is open for: a new activity, or one to change. */
type Open = "new" | PpksActivity | null;

/**
 * One list of activities with the form to add or change one: the PPKS
 * activities of one semester, or the special and additional ones when
 * there is no semester.
 */
export function PpksPanel({
  semester,
  note,
  activities,
  values,
  mayManage,
}: {
  semester: number | null;
  /** The line under the heading. */
  note: string;
  activities: PpksActivity[];
  values: ValueIndicators[];
  mayManage: boolean;
}) {
  const [open, setOpen] = useState<Open>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const words = wordsOf(semester);

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
          <h2 className={shared.heading}>{words.heading}</h2>
          <p className={shared.detail}>{note}</p>
        </div>
        {mayManage && !open && (
          <button
            type="button"
            className={shared.button}
            onClick={() => openFor("new")}
          >
            {words.addButton}
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
        emptyText={words.empty}
        onChange={mayManage ? openFor : null}
      />
    </section>
  );
}
