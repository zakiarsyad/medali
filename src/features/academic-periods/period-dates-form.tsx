"use client";

import { type FormEvent, startTransition, useActionState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import type { AcademicPeriod } from "./academic-period";
import { changePeriodDatesAction } from "./actions";
import styles from "./periods.module.css";

const START: FormState = { error: null, done: null };

export function PeriodDatesForm({ period }: { period: AcademicPeriod }) {
  const [state, save, pending] = useActionState(changePeriodDatesAction, START);

  // Sent from here, not by the browser: the browser puts a sent form back
  // on its first dates, and a refused date must stay to be corrected.
  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(() => save(form));
  }

  return (
    <details className={styles.change}>
      <summary className={shared.link}>Ubah tanggal</summary>
      {/* noValidate: a wrong date gets the app's own message. */}
      <form onSubmit={send} className={shared.form} noValidate>
        <input type="hidden" name="id" value={period.id} />
        <label className={shared.field}>
          Mulai
          <input
            name="startsOn"
            type="date"
            className={shared.input}
            defaultValue={period.startsOn}
          />
        </label>
        <label className={shared.field}>
          Selesai
          <input
            name="endsOn"
            type="date"
            className={shared.input}
            defaultValue={period.endsOn}
          />
        </label>
        <FormMessage state={state} />
        <div className={shared.actions}>
          <button type="submit" className={shared.button} disabled={pending}>
            Simpan tanggal
          </button>
        </div>
      </form>
    </details>
  );
}
