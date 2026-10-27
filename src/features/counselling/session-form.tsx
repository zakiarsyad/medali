"use client";

import { type FormEvent, useState, useTransition } from "react";
import type { SessionStart } from "@/mental-health/session-view";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { sentOr } from "@/ui/save-not-sent";
import styles from "./counselling.module.css";
import { refusedOutcome } from "./not-sent";
import { writeSessionAction } from "./session-actions";
import { SessionFields } from "./session-fields";
import type { SessionOutcome } from "./write-session";

const NO_MESSAGE: FormState = { error: null, done: null };

/**
 * "Catat sesi" for a student whose consent is Disetujui: Tanggal sesi,
 * Jenis, Topik utama, "Catatan sesi (rahasia)", Tindak lanjut and Sesi
 * berikutnya. Opened from a schedule marked Selesai, it is for that
 * schedule and starts with its day and Jenis, under the student's name.
 * Once a session is kept the form starts over, with a new key for the
 * next one, and `onSaved` is told.
 */
export function SessionForm({
  studentId,
  start = null,
  onSaved,
}: {
  studentId: string;
  start?: SessionStart | null;
  onSaved?: (outcome: SessionOutcome) => void;
}) {
  // Kept as it was when the form opened: two presses of "Simpan sesi"
  // must send the same key.
  const [id, setId] = useState(() => crypto.randomUUID());
  const [message, setMessage] = useState<FormState>(NO_MESSAGE);
  const [pending, startSending] = useTransition();

  // Sent from here, not by the browser: the browser empties a sent form,
  // and refused notes must stay to be corrected.
  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sent = event.currentTarget;
    const form = new FormData(sent);
    startSending(async () => {
      const outcome = await sentOr(
        () => writeSessionAction(form),
        refusedOutcome,
      );
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
      {start && <p className={styles.sub}>{start.name}</p>}
      {/* noValidate: a wrong day gets the app's own message. */}
      <form onSubmit={send} className={shared.form} noValidate>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="studentId" value={studentId} />
        <input
          type="hidden"
          name="scheduleId"
          value={start?.scheduleId ?? ""}
        />
        <SessionFields
          defaults={start ? { day: start.day, kind: start.kind } : {}}
        />
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
