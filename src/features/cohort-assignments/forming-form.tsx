"use client";

import { type FormEvent, useActionState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { GROUP_MAX, GROUP_MIN } from "@/ui/group-size";
import { sendForm } from "@/ui/send-form";
import { formGroupsAction } from "./actions";
import styles from "./cohort-assignments.module.css";
import {
  ASSIGNMENT_METHODS,
  type AssignmentMethod,
  METHOD_TITLES,
} from "./methods";

const START: FormState = { error: null, done: null };

const ASK_BEFORE_REPLACING =
  "Bentuk ulang kelompok? Susunan dan pengasuh pada draf akan diganti.";

/** What "Bentuk kelompok" opens with: the draft's choices, or the starting ones. */
export interface FormingStart {
  targetSize: number;
  method: AssignmentMethod;
  /** The version of the draft shown, or 0 for an angkatan without one. */
  version: number;
}

/**
 * "2. Bentuk kelompok": the target size, the method and the button. Once
 * the angkatan has a draft the button forms the groups again, and asks
 * first, because that replaces the draft.
 */
export function FormingForm({
  cohortYear,
  start,
}: {
  cohortYear: number;
  start: FormingStart;
}) {
  const [state, save, pending] = useActionState(formGroupsAction, START);
  const hasDraft = start.version > 0;

  function send(event: FormEvent<HTMLFormElement>) {
    if (hasDraft && !window.confirm(ASK_BEFORE_REPLACING)) {
      event.preventDefault();
      return;
    }
    sendForm(event, save);
  }

  return (
    // noValidate: a size outside the usual one is brought into it, not refused.
    <form onSubmit={send} className={shared.form} noValidate>
      <input type="hidden" name="cohortYear" value={cohortYear} />
      <input type="hidden" name="version" value={start.version} />
      <label className={shared.field}>
        Ukuran target
        <input
          name="targetSize"
          type="number"
          className={shared.input}
          min={GROUP_MIN}
          max={GROUP_MAX}
          defaultValue={start.targetSize}
        />
      </label>
      <label className={shared.field}>
        Metode pembagian
        <select
          name="method"
          className={`${shared.input} ${styles.fit}`}
          defaultValue={start.method}
        >
          {ASSIGNMENT_METHODS.map((method) => (
            <option key={method} value={method}>
              {METHOD_TITLES[method]}
            </option>
          ))}
        </select>
      </label>
      <div className={shared.actions}>
        <button
          type="submit"
          className={hasDraft ? shared.quiet : shared.button}
          disabled={pending}
        >
          {hasDraft ? "Bentuk ulang" : "Bentuk kelompok"}
        </button>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
