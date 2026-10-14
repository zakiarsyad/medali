"use client";

import { unstable_rethrow } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import type { FormState } from "@/ui/form-message";
import {
  decideDormClarificationAction,
  verifyDormClarificationAction,
} from "./clarification-actions";
import {
  type CheckKind,
  type ClarificationStep,
  DECISION_NOT_SENT,
  KIND_WORDS,
  parseDecision,
  STEP_KINDS,
  statusAfterStep,
} from "./clarification-decision";
import type { DormClarificationStatus } from "./clarification-ids";
import { CLARIFICATION_NOTE_MAX_LENGTH } from "./clarification-ids";
import styles from "./leave.module.css";

const ACTIONS = {
  verify: verifyDormClarificationAction,
  decide: decideDormClarificationAction,
};

const NOTE_WORDS: Record<ClarificationStep, string> = {
  verify: "Catatan verifikasi (wajib bila ditolak)",
  decide: "Catatan (wajib bila ditolak)",
};

/** What a press answered, with where the clarification stands when it was kept. */
export interface DecideAnswer {
  state: FormState;
  status: DormClarificationStatus | null;
}

/**
 * Catatan and the buttons of one step on a card: "Terima, teruskan ke
 * pengelola" and "Tolak klarifikasi" for BAM, "Terima sebagai hadir",
 * "Terima sebagai izin" and "Tolak" for Pengelola Asrama. A rejection
 * without a note is answered at once and sent nowhere. While a press is
 * on its way no button can be pressed, also by a second press that comes
 * before the buttons are drawn again.
 */
export function ClarificationDecide({
  id,
  step,
  onAnswer,
}: {
  id: string;
  step: ClarificationStep;
  onAnswer: (answer: DecideAnswer) => void;
}) {
  const [note, setNote] = useState("");
  const [pending, startSending] = useTransition();
  const isOnItsWay = useRef(false);

  function press(kind: CheckKind) {
    if (isOnItsWay.current) return;
    const checked = parseDecision(step, kind, note);
    if (!checked.ok) {
      onAnswer({ state: { error: checked.error, done: null }, status: null });
      return;
    }
    isOnItsWay.current = true;
    startSending(async () => {
      try {
        const state = await ACTIONS[step](id, kind, note);
        const status = state.done ? statusAfterStep(step, kind) : null;
        onAnswer({ state, status });
      } catch (error) {
        unstable_rethrow(error);
        onAnswer({
          state: { error: DECISION_NOT_SENT, done: null },
          status: null,
        });
      } finally {
        isOnItsWay.current = false;
      }
    });
  }

  return (
    <div className={styles.decide}>
      <input
        className={shared.input}
        aria-label="Catatan"
        placeholder={NOTE_WORDS[step]}
        maxLength={CLARIFICATION_NOTE_MAX_LENGTH}
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      {STEP_KINDS[step].map((kind, place) => (
        <button
          key={kind}
          type="button"
          className={place === 0 ? shared.button : shared.quiet}
          disabled={pending}
          onClick={() => press(kind)}
        >
          {KIND_WORDS[step][kind]}
        </button>
      ))}
    </div>
  );
}
