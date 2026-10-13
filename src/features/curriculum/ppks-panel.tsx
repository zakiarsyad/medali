"use client";

import { useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage } from "@/ui/form-message";
import styles from "./curriculum.module.css";
import type { ValueIndicators } from "./main-indicators";
import { type PpksActivity, wordsOf } from "./ppks-activities";
import { PpksForm } from "./ppks-form";
import { PpksTable } from "./ppks-table";

/** What an activity form is open for: a new activity, or one to change. */
export type FormTarget = "new" | PpksActivity;

/**
 * One list of activities with the form to add or change one: the PPKS
 * activities of one semester, or the special and additional ones when
 * there is no semester. The page holds which form is open, as only one
 * is open at a time over all its lists.
 */
export function PpksPanel({
  semester,
  note,
  activities,
  values,
  mayManage,
  newActivityId,
  open,
  isFormOpen,
  onOpen,
}: {
  semester: number | null;
  /** The line under the heading. */
  note: string;
  activities: PpksActivity[];
  values: ValueIndicators[];
  mayManage: boolean;
  /** The key for the next activity a form adds. */
  newActivityId: string;
  /** What the form of this list is open for, or null while it is closed. */
  open: FormTarget | null;
  /** Whether a form is open in any list of the page. */
  isFormOpen: boolean;
  /** Opens the form of this list, or closes it with null. */
  onOpen: (target: FormTarget | null) => void;
}) {
  const [saved, setSaved] = useState<string | null>(null);
  const words = wordsOf(semester);

  function openFor(target: FormTarget) {
    setSaved(null);
    onOpen(target);
  }

  function showSaved(message: string) {
    setSaved(message);
    onOpen(null);
  }

  return (
    <section className={shared.panel}>
      <div className={styles.panelHead}>
        <div>
          <h2 className={shared.heading}>{words.heading}</h2>
          <p className={shared.detail}>{note}</p>
        </div>
        {mayManage && !isFormOpen && (
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
          newActivityId={newActivityId}
          values={values}
          onSaved={showSaved}
          onCancel={() => onOpen(null)}
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
