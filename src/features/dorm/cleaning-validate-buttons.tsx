"use client";

import { type FormEvent, useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import styles from "./cleaning.module.css";
import {
  sendBackDutyAction,
  validateDutyAction,
} from "./cleaning-assessment-actions";
import { CLEANING_NOTE_MAX_LENGTH } from "./cleaning-ids";

/**
 * "Validasi" and "Tolak penilaian" for a duty Pengelola Asrama may decide.
 * "Tolak penilaian" asks for its reason here, in the row. What a decision
 * says goes up to the schedule, as the row changes with it; a refusal
 * stays here.
 */
export function CleaningValidateButtons({
  dutyId,
  onSaid,
}: {
  dutyId: string;
  onSaid: (text: string) => void;
}) {
  const [isAsking, setIsAsking] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startSending] = useTransition();

  function send(decide: () => Promise<FormState>) {
    startSending(async () => {
      const after = await decide();
      setError(after.error);
      if (after.done) onSaid(after.done);
    });
  }

  function sendBack(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    send(() => sendBackDutyAction(dutyId, reason));
  }

  if (isAsking) {
    return (
      <form onSubmit={sendBack} className={styles.judge} noValidate>
        <input
          className={shared.input}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={CLEANING_NOTE_MAX_LENGTH}
          placeholder="Alasan penolakan (akan dinilai ulang oleh BAM)"
          aria-label="Alasan penolakan penilaian"
        />
        <button type="submit" className={shared.button} disabled={pending}>
          Kirim penolakan
        </button>
        <button
          type="button"
          className={shared.link}
          onClick={() => setIsAsking(false)}
          disabled={pending}
        >
          Batal
        </button>
        <FormMessage state={{ error, done: null }} />
      </form>
    );
  }
  return (
    <div className={styles.judge}>
      <button
        type="button"
        className={shared.button}
        onClick={() => send(() => validateDutyAction(dutyId))}
        disabled={pending}
      >
        Validasi
      </button>
      <button
        type="button"
        className={shared.link}
        onClick={() => setIsAsking(true)}
        disabled={pending}
      >
        Tolak penilaian
      </button>
      <FormMessage state={{ error, done: null }} />
    </div>
  );
}
