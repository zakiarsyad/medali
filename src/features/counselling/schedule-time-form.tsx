"use client";

import type { FormEvent } from "react";
import {
  COUNSELLING_HOURS,
  COUNSELLING_WAYS,
  NOTE_MAX,
} from "@/mental-health/schedule-ids";
import shared from "@/ui/data-screen.module.css";
import styles from "./counselling.module.css";
import { ChoiceOptions } from "./schedule-options";
import type { CounsellorScheduleCard } from "./schedule-view";
import { COUNSELLING_WAY_WORDS } from "./schedule-words";

/**
 * "Usulkan waktu lain" and "Ubah jadwal": Tanggal, Jam, Cara and "Pesan
 * untuk mahasiswa", starting from the time of the card. `sendWords` is
 * what its send button says.
 */
export function ScheduleTimeForm({
  card,
  sendWords,
  pending,
  onSend,
  onCancel,
}: {
  card: CounsellorScheduleCard;
  sendWords: string;
  pending: boolean;
  onSend: (form: FormData) => void;
  onCancel: () => void;
}) {
  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSend(new FormData(event.currentTarget));
  }

  // noValidate: a wrong day gets the app's own message.
  return (
    <form onSubmit={send} className={shared.form} noValidate>
      <label className={shared.field}>
        Tanggal
        <input
          name="day"
          type="date"
          className={shared.input}
          defaultValue={card.day ?? undefined}
        />
      </label>
      <label className={shared.field}>
        Jam
        <select
          name="hour"
          className={shared.input}
          defaultValue={card.hour ?? undefined}
        >
          <ChoiceOptions choices={COUNSELLING_HOURS} />
        </select>
      </label>
      <label className={`${shared.field} ${styles.full}`}>
        Cara
        <select
          name="way"
          className={shared.input}
          defaultValue={card.way ?? undefined}
        >
          <ChoiceOptions
            choices={COUNSELLING_WAYS}
            words={COUNSELLING_WAY_WORDS}
          />
        </select>
      </label>
      <label className={`${shared.field} ${styles.full}`}>
        Pesan untuk mahasiswa
        <input
          name="message"
          className={shared.input}
          placeholder="Opsional"
          maxLength={NOTE_MAX}
        />
      </label>
      <div className={`${shared.actions} ${styles.full}`}>
        <button type="submit" className={shared.button} disabled={pending}>
          {sendWords}
        </button>
        <button
          type="button"
          className={shared.quiet}
          disabled={pending}
          onClick={onCancel}
        >
          Batal
        </button>
      </div>
    </form>
  );
}
