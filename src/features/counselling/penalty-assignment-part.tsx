"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useState, useTransition } from "react";
import { ASSIGNMENT_TEXT_MAX } from "@/mental-health/schedule-ids";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { refusedSave, sentOr } from "@/ui/save-not-sent";
import styles from "./counselling.module.css";
import { assignFromPenaltyAction } from "./penalty-assignment-actions";
import { readsPageAgain } from "./penalty-assignment-rules";
import {
  ASSIGN_BUTTON,
  ASSIGN_HEADING,
  assignQuestion,
  MESSAGE_LABEL,
} from "./penalty-assignment-words";

const NO_MESSAGE: FormState = { error: null, done: null };

/**
 * "Tugaskan konseling wajib" in "Rincian" of a penalty, for Pembina
 * Disiplin Mahasiswa: the message and the button, asked before it is
 * sent, while the penalty has no Penugasan; else `box`, how it stands.
 * Once there is one the page is read again, so `box` takes the place of
 * the form, and the message of the send stays under it.
 */
export function PenaltyAssignmentPart({
  penaltyId,
  name,
  box,
}: {
  penaltyId: string;
  /** The student's name, for the question. */
  name: string;
  box: ReactNode;
}) {
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const [message, setMessage] = useState<FormState>(NO_MESSAGE);
  const [pending, startSending] = useTransition();

  function press() {
    if (!window.confirm(assignQuestion(name))) return;
    setMessage(NO_MESSAGE);
    startSending(async () => {
      const answer = await sentOr(
        () => assignFromPenaltyAction(penaltyId, typed),
        refusedSave,
      );
      setMessage(answer);
      if (readsPageAgain(answer)) router.refresh();
    });
  }

  if (box !== null) {
    return (
      <div className={`${styles.card} ${styles.assignment}`}>
        {box}
        <FormMessage state={message} />
      </div>
    );
  }
  return (
    <section className={`${styles.card} ${styles.assignment}`}>
      <h3 className={styles.subHeading}>{ASSIGN_HEADING}</h3>
      <div className={shared.form}>
        <label className={shared.field}>
          {MESSAGE_LABEL}
          <input
            className={shared.input}
            value={typed}
            maxLength={ASSIGNMENT_TEXT_MAX}
            disabled={pending}
            onChange={(event) => setTyped(event.target.value)}
          />
        </label>
        <div className={shared.actions}>
          <button
            type="button"
            className={shared.button}
            disabled={pending}
            onClick={press}
          >
            {ASSIGN_BUTTON}
          </button>
        </div>
      </div>
      <FormMessage state={message} />
    </section>
  );
}
