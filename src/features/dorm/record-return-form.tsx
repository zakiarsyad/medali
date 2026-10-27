"use client";

import { useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import type { FormState } from "@/ui/form-message";
import { NOT_SENT, sentOr } from "@/ui/save-not-sent";
import styles from "./leave.module.css";
import { recordReturnAction } from "./leave-actions";

/**
 * "Waktu kembali" and "Catat sudah kembali" on the card of leave that is
 * out, with the return time beside them. The time starts at the moment
 * the page was read, and no later time is offered; the server checks it
 * again. What the server answered goes to `onAnswer`.
 */
export function RecordReturnForm({
  leaveId,
  end,
  isLate,
  asOf,
  onAnswer,
}: {
  leaveId: string;
  /** The return time of the leave, as the screens show it. */
  end: string;
  /** Whether the return time has passed. */
  isLate: boolean;
  /** The moment the page was read, as a time on campus. */
  asOf: string;
  onAnswer: (state: FormState) => void;
}) {
  const [time, setTime] = useState(asOf);
  const [pending, startSending] = useTransition();

  function send() {
    startSending(async () => {
      onAnswer(await sentOr(() => recordReturnAction(leaveId, time), NOT_SENT));
    });
  }

  return (
    <div className={styles.decide}>
      <label className={styles.recordTime}>
        Waktu kembali
        <input
          type="datetime-local"
          className={shared.input}
          value={time}
          max={asOf}
          onChange={(event) => setTime(event.target.value)}
        />
      </label>
      <button
        type="button"
        className={shared.quiet}
        disabled={pending}
        onClick={send}
      >
        Catat sudah kembali
      </button>
      <span className={styles.quietLine}>
        {isLate ? `Melewati batas kembali ${end}` : `Batas kembali ${end}`}
      </span>
    </div>
  );
}
