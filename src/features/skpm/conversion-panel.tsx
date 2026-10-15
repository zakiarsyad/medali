"use client";

import { type FormEvent, startTransition, useActionState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import styles from "./skpm.module.css";
import { saveConversionAction } from "./skpm-actions";
import {
  POINTS_FOR_100_MAX,
  POINTS_FOR_100_MIN,
  SKPM_CATEGORIES,
  SKPM_LEVELS,
} from "./skpm-ids";

const START: FormState = { error: null, done: null };

/**
 * "Konversi poin ke nilai": "Poin untuk nilai 100" with "Simpan
 * konversi", who set it last, and the kategori and tingkat of the SKPM
 * guidelines.
 */
export function ConversionPanel({
  pointsForHundred,
  note,
}: {
  pointsForHundred: number;
  /** Who set the number last and when, or that it is the starting one. */
  note: string;
}) {
  const [state, save, pending] = useActionState(saveConversionAction, START);

  // Sent from here, not by the browser: the browser puts a sent form back
  // on its first number, and a refused number must stay to be corrected.
  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(() => save(form));
  }

  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>Konversi poin ke nilai</h2>
      {/* noValidate: a number outside 1–1000 gets the app's own message. */}
      <form onSubmit={send} className={styles.conversionRow} noValidate>
        <label className={shared.field}>
          Poin untuk nilai 100
          <input
            name="points"
            type="number"
            min={POINTS_FOR_100_MIN}
            max={POINTS_FOR_100_MAX}
            step={1}
            className={shared.input}
            defaultValue={pointsForHundred}
          />
        </label>
        <button type="submit" className={shared.quiet} disabled={pending}>
          Simpan konversi
        </button>
      </form>
      <FormMessage state={state} />
      <p className={styles.sub}>
        Nilai SKPM = total poin ÷ {pointsForHundred.toLocaleString("id-ID")} ×
        100, paling tinggi 100. {note}
      </p>
      <h3 className={styles.subheading}>Kategori kegiatan</h3>
      <p className={styles.sub}>
        {SKPM_CATEGORIES.join(", ")}. Tingkat: {SKPM_LEVELS.join(", ")}.
      </p>
    </section>
  );
}
