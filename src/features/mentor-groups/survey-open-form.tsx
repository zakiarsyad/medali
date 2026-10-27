"use client";

import { type FormEvent, useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage } from "@/ui/form-message";
import { NOT_SENT, sentOr } from "@/ui/save-not-sent";
import { NOTE_MAX_LENGTH } from "./evaluation-input";
import styles from "./mentor-groups.module.css";
import { openSurveyPeriodAction } from "./survey-actions";
import {
  openAgainQuestion,
  type SurveyFormStart,
  typedFeedbackWeight,
  WEIGHT_TOTAL,
} from "./survey-form-start";
import { useSurveySaid } from "./survey-said";

/**
 * "Buka periode evaluasi pengasuhan": the Periode, the two dates, the
 * weight of capaian karakter with the rest of 100 beside it, and a note
 * for the students. A Periode that was opened before is asked about
 * first. The button is off while a change is on its way, so two presses
 * open one period. What is typed stays when the server refuses it.
 */
export function SurveyOpenForm({ start }: { start: SurveyFormStart }) {
  const { isSending, send, announce } = useSurveySaid();
  const [error, setError] = useState<string | null>(null);
  const [weight, setWeight] = useState(String(start.achievementWeight));

  function open(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const chosen = start.choices.find(
      (choice) => choice.id === form.get("periodId"),
    );
    if (chosen?.wasOpened && !window.confirm(openAgainQuestion(chosen.title))) {
      return;
    }
    send(async () => {
      const after = await sentOr(() => openSurveyPeriodAction(form), NOT_SENT);
      if (after.done !== null) {
        // The card of the period takes the place of this form.
        announce(after.done);
        return;
      }
      setError(after.error);
    });
  }

  return (
    // noValidate: the server says what is wrong, in the words of the app.
    <form onSubmit={open} className={shared.form} noValidate>
      <label className={`${shared.field} ${styles.whole}`}>
        Periode
        <select name="periodId" className={`${shared.input} ${styles.fit}`}>
          {start.choices.map((choice) => (
            <option key={choice.id} value={choice.id}>
              {choice.title}
            </option>
          ))}
        </select>
      </label>
      <label className={shared.field}>
        Tanggal dibuka
        <input
          name="startsOn"
          type="date"
          className={shared.input}
          defaultValue={start.startsOn}
        />
      </label>
      <label className={shared.field}>
        Tanggal ditutup
        <input
          name="endsOn"
          type="date"
          className={shared.input}
          defaultValue={start.endsOn}
        />
      </label>
      <label className={shared.field}>
        Bobot capaian karakter (%)
        <input
          name="achievementWeight"
          type="number"
          inputMode="numeric"
          min={0}
          max={WEIGHT_TOTAL}
          className={shared.input}
          value={weight}
          onChange={(event) => setWeight(event.target.value)}
        />
      </label>
      <label className={shared.field}>
        Bobot umpan balik mahasiswa (%)
        <input
          className={shared.input}
          value={typedFeedbackWeight(weight)}
          disabled
          readOnly
        />
      </label>
      <label className={`${shared.field} ${styles.whole}`}>
        Keterangan untuk mahasiswa (opsional)
        <textarea
          name="note"
          className={shared.input}
          rows={3}
          maxLength={NOTE_MAX_LENGTH}
          placeholder="Misalnya tujuan survei atau batas pengisian"
        />
      </label>
      <div className={shared.actions}>
        <button type="submit" className={shared.button} disabled={isSending}>
          Buka periode evaluasi
        </button>
      </div>
      <FormMessage state={{ error, done: null }} />
    </form>
  );
}
