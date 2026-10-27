"use client";

import { type FormEvent, useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage } from "@/ui/form-message";
import { sentOr } from "@/ui/save-not-sent";
import styles from "./cleaning.module.css";
import {
  sendBackDutyAction,
  validateDutyAction,
} from "./cleaning-assessment-actions";
import { CLEANING_NOTE_MAX_LENGTH } from "./cleaning-ids";
import { type DecisionAnswer, NOT_SENT_DECISION } from "./leave-messages";

/**
 * "Validasi" and the rejecting button for a duty Pengelola Asrama may
 * decide: "Tolak penilaian" on Pembersihan asrama, "Tolak" on Tugas
 * saya. The rejecting button asks for its reason here, in the row. Both
 * wait for the answer, so a second press sends nothing. `onAnswer` takes
 * what the server answered and gives back what stays here.
 */
export function CleaningValidateButtons({
  dutyId,
  rejectLabel,
  onAnswer,
}: {
  dutyId: string;
  rejectLabel: string;
  onAnswer: (answer: DecisionAnswer) => string | null;
}) {
  const [isAsking, setIsAsking] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startSending] = useTransition();

  function send(decide: () => Promise<DecisionAnswer>) {
    startSending(async () => {
      setError(onAnswer(await sentOr(decide, NOT_SENT_DECISION)));
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
        {rejectLabel}
      </button>
      <FormMessage state={{ error, done: null }} />
    </div>
  );
}
