"use client";

import { type FormEvent, useState, useTransition } from "react";
import { campusDay } from "@/academic-periods/campus-day";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import styles from "./counselling.module.css";
import { COUNSELLING_TOPICS } from "./schedule-ids";
import { ChoiceOptions } from "./schedule-options";
import { TOPIC_WORDS } from "./schedule-words";
import { writeSessionAction } from "./session-actions";
import {
  SESSION_FOLLOW_UPS,
  SESSION_KINDS,
  SESSION_NOTES_MAX,
} from "./session-ids";
import { FOLLOW_UP_WORDS, SESSION_KIND_WORDS } from "./session-words";
import type { SessionOutcome } from "./write-session";

const NO_MESSAGE: FormState = { error: null, done: null };

/**
 * "Catat sesi" for a student whose consent is Disetujui: Tanggal sesi,
 * Jenis, Topik utama, "Catatan sesi (rahasia)", Tindak lanjut and Sesi
 * berikutnya. Once a session is kept the form starts over, with a new
 * key for the next one, and `onSaved` is told.
 */
export function SessionForm({
  studentId,
  onSaved,
}: {
  studentId: string;
  onSaved?: (outcome: SessionOutcome) => void;
}) {
  // Kept as it was when the form opened: two presses of "Simpan sesi"
  // must send the same key.
  const [id, setId] = useState(() => crypto.randomUUID());
  const [message, setMessage] = useState<FormState>(NO_MESSAGE);
  const [pending, startSending] = useTransition();
  const today = campusDay();

  // Sent from here, not by the browser: the browser empties a sent form,
  // and refused notes must stay to be corrected.
  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sent = event.currentTarget;
    const form = new FormData(sent);
    startSending(async () => {
      const outcome = await writeSessionAction(form);
      if (outcome.kind === "refused") {
        setMessage({ error: outcome.error, done: null });
        return;
      }
      setMessage({ error: null, done: outcome.done });
      sent.reset();
      setId(crypto.randomUUID());
      onSaved?.(outcome);
    });
  }

  return (
    <div className={styles.stack}>
      <h3 className={shared.heading}>Catat sesi</h3>
      {/* noValidate: a wrong day gets the app's own message. */}
      <form onSubmit={send} className={shared.form} noValidate>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="studentId" value={studentId} />
        <label className={shared.field}>
          Tanggal sesi
          <input
            name="day"
            type="date"
            className={shared.input}
            max={today}
            defaultValue={today}
          />
        </label>
        <label className={shared.field}>
          Jenis
          <select name="kind" className={shared.input}>
            <ChoiceOptions choices={SESSION_KINDS} words={SESSION_KIND_WORDS} />
          </select>
        </label>
        <label className={shared.field}>
          Topik utama
          <select name="topic" className={shared.input}>
            <ChoiceOptions choices={COUNSELLING_TOPICS} words={TOPIC_WORDS} />
          </select>
        </label>
        <label className={`${shared.field} ${styles.full}`}>
          Catatan sesi (rahasia)
          <textarea
            name="notes"
            rows={4}
            maxLength={SESSION_NOTES_MAX}
            placeholder="Hanya dapat dibaca konselor"
            className={shared.input}
          />
        </label>
        <label className={shared.field}>
          Tindak lanjut
          <select name="followUp" className={shared.input}>
            <ChoiceOptions
              choices={SESSION_FOLLOW_UPS}
              words={FOLLOW_UP_WORDS}
            />
          </select>
        </label>
        <label className={shared.field}>
          Sesi berikutnya (opsional)
          <input name="nextDay" type="date" className={shared.input} />
        </label>
        <div className={`${shared.actions} ${styles.full}`}>
          <button type="submit" className={shared.button} disabled={pending}>
            Simpan sesi
          </button>
        </div>
        <div className={styles.full}>
          <FormMessage state={message} />
        </div>
      </form>
    </div>
  );
}
