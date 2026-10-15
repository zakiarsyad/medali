"use client";

import { type FormEvent, startTransition, useActionState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { saveKeepDaysAction } from "./actions";
import { KEEP_DAYS_MAX, KEEP_DAYS_MIN } from "./keep-days";
import styles from "./proof-files.module.css";

const START: FormState = { error: null, done: null };

/** The number of days proof files are kept, empty while not set. */
export function KeepDaysForm({ keepDays }: { keepDays: number | null }) {
  const [state, save, pending] = useActionState(saveKeepDaysAction, START);

  // Sent from here, not by the browser: the browser puts a sent form back
  // on its first number, and a refused number must stay to be corrected.
  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(() => save(form));
  }

  return (
    <>
      {/* noValidate: a number outside 30–3650 gets the app's own message. */}
      <form onSubmit={send} className={styles.daysRow} noValidate>
        <label className={shared.field}>
          Lama simpan berkas bukti (hari)
          <input
            name="days"
            type="number"
            inputMode="numeric"
            min={KEEP_DAYS_MIN}
            max={KEEP_DAYS_MAX}
            className={shared.input}
            defaultValue={keepDays ?? ""}
          />
        </label>
        <button type="submit" className={shared.button} disabled={pending}>
          Simpan
        </button>
      </form>
      {(state.error || state.done) && (
        <div className={styles.message}>
          <FormMessage state={state} />
        </div>
      )}
    </>
  );
}
