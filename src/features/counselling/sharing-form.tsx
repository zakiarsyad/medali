"use client";

import type { FormEvent } from "react";
import shared from "@/ui/data-screen.module.css";
import styles from "./counselling.module.css";
import {
  SHARING_RECIPIENTS,
  type SharedData,
  SUMMARY_MAX,
} from "./sharing-ids";
import {
  ASK_NOTE,
  RECIPIENT_LIMITS,
  recipientWords,
  SHARED_DATA_WORDS,
  SUMMARY_PLACEHOLDER,
} from "./sharing-words";

/** What "Minta persetujuan mahasiswa" sends, as the form holds it. */
export interface SharingAsk {
  data: string[];
  recipients: string[];
  summary: string;
}

function textsOf(form: FormData, name: string): string[] {
  return form.getAll(name).filter((value) => typeof value === "string");
}

/**
 * "Data yang dibagikan" offered for the student, "Penerima", "Ringkasan
 * untuk penerima" while the summary is offered, and "Minta persetujuan
 * mahasiswa". Nothing is ticked at the start, so Konselor ticks each
 * data and each recipient on purpose.
 */
export function SharingForm({
  offered,
  pending,
  onAsk,
}: {
  offered: readonly SharedData[];
  pending: boolean;
  onAsk: (ask: SharingAsk) => void;
}) {
  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const summary = form.get("summary");
    onAsk({
      data: textsOf(form, "data"),
      recipients: textsOf(form, "recipients"),
      summary: typeof summary === "string" ? summary : "",
    });
  }

  return (
    <form onSubmit={send} className={shared.form} noValidate>
      <fieldset className={`${shared.roles} ${styles.ticks} ${styles.full}`}>
        <legend className={shared.label}>Data yang dibagikan</legend>
        {offered.map((data) => (
          <label key={data} className={styles.tick}>
            <input type="checkbox" name="data" value={data} />
            <span>{SHARED_DATA_WORDS[data]}</span>
          </label>
        ))}
      </fieldset>
      <fieldset className={`${shared.roles} ${styles.ticks} ${styles.full}`}>
        <legend className={shared.label}>Penerima</legend>
        {SHARING_RECIPIENTS.map((recipient) => (
          <label key={recipient} className={styles.tick}>
            <input type="checkbox" name="recipients" value={recipient} />
            <span>
              {recipientWords(recipient)}
              {RECIPIENT_LIMITS[recipient] && ` ${RECIPIENT_LIMITS[recipient]}`}
            </span>
          </label>
        ))}
      </fieldset>
      {offered.includes("summary") && (
        <label className={`${shared.field} ${styles.full}`}>
          Ringkasan untuk penerima
          <textarea
            name="summary"
            rows={3}
            maxLength={SUMMARY_MAX}
            placeholder={SUMMARY_PLACEHOLDER}
            className={shared.input}
          />
        </label>
      )}
      <div className={`${shared.actions} ${styles.full}`}>
        <button type="submit" className={shared.button} disabled={pending}>
          Minta persetujuan mahasiswa
        </button>
      </div>
      <p className={`${styles.sub} ${styles.full}`}>{ASK_NOTE}</p>
    </form>
  );
}
