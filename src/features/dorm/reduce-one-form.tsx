"use client";

import { unstable_rethrow } from "next/navigation";
import { type FormEvent, useRef, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import { text } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { reduceOneViolationAction } from "./reduction-actions";
import { reductionReasonFault } from "./reduction-rules";
import {
  REASON_EXAMPLE,
  REASON_LABEL,
  reduceOneQuestion,
} from "./reduction-words";
import { REDUCTION_REASON_MAX_LENGTH } from "./violation-ids";
import styles from "./violations.module.css";

/** Said when the reduction did not reach the server, or no answer came back. */
export const REDUCE_NOT_SENT =
  "Pelanggaran belum dikurangi karena tidak terkirim. Periksa koneksi internet, lalu coba lagi.";

/**
 * The form one violation is reduced with: Dasar pengurangan, "Kurangi"
 * and "Batal", one column on a phone. "Kurangi" asks before it reduces.
 * A reason the server would refuse is answered at once and sent nowhere.
 * While it is sent neither button can be pressed, so a second press
 * sends nothing more.
 */
export function ReduceOneForm({
  studentId,
  name,
  violationId,
  day,
  onAnswer,
  onCancel,
}: {
  studentId: string;
  /** The name of the resident, which the question before reducing says. */
  name: string;
  violationId: string;
  day: string;
  onAnswer: (answer: FormState) => void;
  onCancel: () => void;
}) {
  const [sending, startSending] = useTransition();
  // Set at the press itself: `sending` is known only once the form is
  // drawn again, and a second press can come before that.
  const isOnItsWay = useRef(false);

  function submitted(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reason = text(new FormData(event.currentTarget), "reason");
    const fault = reductionReasonFault(reason);
    if (fault !== null) return onAnswer({ error: fault, done: null });
    if (isOnItsWay.current) return;
    if (!window.confirm(reduceOneQuestion(day, name))) return;
    isOnItsWay.current = true;
    startSending(async () => {
      try {
        onAnswer(
          await reduceOneViolationAction({ studentId, violationId, reason }),
        );
      } catch (error) {
        unstable_rethrow(error);
        onAnswer({ error: REDUCE_NOT_SENT, done: null });
      } finally {
        isOnItsWay.current = false;
      }
    });
  }

  return (
    <form className={shared.form} onSubmit={submitted} noValidate>
      <label className={`${shared.field} ${styles.field} ${styles.full}`}>
        {REASON_LABEL}
        <textarea
          name="reason"
          rows={2}
          className={shared.input}
          placeholder={REASON_EXAMPLE}
          maxLength={REDUCTION_REASON_MAX_LENGTH}
        />
      </label>
      <div className={`${shared.actions} ${styles.full}`}>
        <button type="submit" className={shared.button} disabled={sending}>
          {sending ? "Mengurangi…" : "Kurangi"}
        </button>
        <button
          type="button"
          className={shared.quiet}
          disabled={sending}
          onClick={onCancel}
        >
          Batal
        </button>
      </div>
    </form>
  );
}
