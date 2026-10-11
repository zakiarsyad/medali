"use client";

import { type FormEvent, startTransition, useActionState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { saveBaseScoreAction } from "./actions";
import styles from "./curriculum.module.css";

const START: FormState = { error: null, done: null };

export function BaseScorePanel({
  score,
  note,
  mayChange,
}: {
  score: number;
  /** Who set the score last, or that it is the starting one. */
  note: string;
  mayChange: boolean;
}) {
  const [state, save, pending] = useActionState(saveBaseScoreAction, START);

  // Sent from here, not by the browser: the browser puts a sent form back
  // on its first number, and a refused number must stay to be corrected.
  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(() => save(form));
  }

  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>Nilai dasar SIKU</h2>
      <p className={shared.detail}>
        Nilai awal sikap dan perilaku (SIKU) yang sama untuk semua mahasiswa
        sebelum penambahan dan pengurangan. {note}
      </p>
      {/* noValidate: a number outside 0–100 gets the app's own message. */}
      <form onSubmit={send} className={styles.scoreRow} noValidate>
        <label className={shared.field}>
          Nilai dasar (0–100)
          <input
            name="score"
            type="number"
            min={0}
            max={100}
            className={shared.input}
            defaultValue={score}
            disabled={!mayChange}
          />
        </label>
        {mayChange && (
          <button type="submit" className={shared.quiet} disabled={pending}>
            Simpan nilai dasar
          </button>
        )}
        <span className={shared.detail}>
          SIKU akhir = nilai dasar + penambahan − pengurangan, dibatasi 0–100.
        </span>
      </form>
      {(state.error || state.done) && (
        <div className={styles.message}>
          <FormMessage state={state} />
        </div>
      )}
    </section>
  );
}
