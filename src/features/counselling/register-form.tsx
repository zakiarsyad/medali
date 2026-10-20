"use client";

import { type FormEvent, startTransition, useActionState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { CONSENT_TEXT } from "./consent-words";
import styles from "./counselling.module.css";
import { registerCounsellingAction } from "./own-schedule-actions";
import {
  COUNSELLING_HOURS,
  COUNSELLING_TOPICS,
  COUNSELLING_WAYS,
  STORY_MAX,
} from "./schedule-ids";
import { ChoiceOptions } from "./schedule-options";
import {
  COUNSELLING_WAY_WORDS,
  HOURS_NOTE,
  TOPIC_WORDS,
} from "./schedule-words";

const START: FormState = { error: null, done: null };

/**
 * "Daftar konseling sukarela": Topik, Tanggal yang diinginkan, Jam, Cara
 * konseling, "Ceritakan singkat" and the consent tick. `tomorrow` is the
 * first day that may be picked, as the day the form opens with.
 */
export function RegisterForm({ tomorrow }: { tomorrow: string }) {
  const [state, save, pending] = useActionState(
    registerCounsellingAction,
    START,
  );

  // Sent from here, not by the browser: the browser empties a sent form,
  // and a refused day must stay to be corrected.
  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(() => save(form));
  }

  return (
    <section className={`${shared.panel} ${styles.stack}`}>
      <h2 className={shared.heading}>Daftar konseling sukarela</h2>
      {/* noValidate: a wrong day gets the app's own message. */}
      <form onSubmit={send} className={shared.form} noValidate>
        <label className={`${shared.field} ${styles.full}`}>
          Topik
          <select name="topic" className={shared.input}>
            <ChoiceOptions choices={COUNSELLING_TOPICS} words={TOPIC_WORDS} />
          </select>
        </label>
        <label className={shared.field}>
          Tanggal yang diinginkan
          <input
            name="day"
            type="date"
            className={shared.input}
            min={tomorrow}
            defaultValue={tomorrow}
          />
        </label>
        <label className={shared.field}>
          Jam
          <select name="hour" className={shared.input}>
            <ChoiceOptions choices={COUNSELLING_HOURS} />
          </select>
        </label>
        <label className={`${shared.field} ${styles.full}`}>
          Cara konseling
          <select name="way" className={shared.input}>
            <ChoiceOptions
              choices={COUNSELLING_WAYS}
              words={COUNSELLING_WAY_WORDS}
            />
          </select>
        </label>
        <label className={`${shared.field} ${styles.full}`}>
          Ceritakan singkat (opsional, hanya dibaca konselor)
          <textarea
            name="story"
            rows={3}
            maxLength={STORY_MAX}
            className={shared.input}
          />
        </label>
        <label className={`${styles.tick} ${styles.full}`}>
          <input type="checkbox" name="consented" value="yes" />
          <span>{CONSENT_TEXT}</span>
        </label>
        <div className={`${shared.actions} ${styles.full}`}>
          <button type="submit" className={shared.button} disabled={pending}>
            Daftar konseling
          </button>
        </div>
        <div className={styles.full}>
          <FormMessage state={state} />
        </div>
      </form>
      <p className={styles.sub}>{HOURS_NOTE}</p>
    </section>
  );
}
