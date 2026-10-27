"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { sentOr } from "@/ui/save-not-sent";
import styles from "./leave.module.css";
import { DECISION_NOTE_MAX_LENGTH } from "./leave-ids";
import {
  type DecisionAnswer,
  REJECTION_NEEDS_NOTE,
  refusedDecisionWith,
} from "./leave-messages";
import own from "./tasks.module.css";
import { taskOutcome } from "./tasks-card";

/** A button that agrees, such as Setujui, and the decision it sends. */
export interface AgreeButton {
  label: string;
  decision: string;
}

/**
 * What to do with the answer to a press on an item of Tugas saya. When
 * the item leaves the list, because the decision was kept or because it
 * was decided or cancelled elsewhere first, what to say goes to
 * `onSettled`, and for the second the list is read again. Gives back
 * what stays on the item: any other refusal.
 */
export function useTaskAnswer(
  onSettled: (said: FormState) => void,
): (answer: DecisionAnswer) => string | null {
  const router = useRouter();
  return (answer) => {
    const outcome = taskOutcome(answer);
    if (outcome.onSection) onSettled(outcome.onSection);
    if (outcome.reload) router.refresh();
    return outcome.onCard;
  };
}

/**
 * Catatan, the agreeing buttons and "Tolak" on an item of Tugas saya.
 * "Tolak" without a note sends nothing and asks for the reason; with a
 * note it asks `question` first. Every button waits for the answer, so a
 * second press sends nothing. What the answer does is `useTaskAnswer`'s.
 */
export function TaskDecide({
  agrees,
  question,
  noteMaxLength = DECISION_NOTE_MAX_LENGTH,
  decide,
  onSettled,
}: {
  agrees: readonly AgreeButton[];
  /** What is asked before a rejection is sent. */
  question: string;
  noteMaxLength?: number;
  decide: (decision: string, note: string) => Promise<DecisionAnswer>;
  onSettled: (said: FormState) => void;
}) {
  const answered = useTaskAnswer(onSettled);
  const [note, setNote] = useState("");
  const [refusal, setRefusal] = useState<string | null>(null);
  const [pending, startSending] = useTransition();

  function send(decision: string) {
    startSending(async () => {
      setRefusal(
        answered(
          await sentOr(() => decide(decision, note), refusedDecisionWith),
        ),
      );
    });
  }

  function reject() {
    if (note.trim() === "") {
      setRefusal(REJECTION_NEEDS_NOTE.error);
      return;
    }
    if (!window.confirm(question)) return;
    send("reject");
  }

  return (
    <>
      <div className={`${styles.decide} ${own.decide}`}>
        <input
          className={shared.input}
          aria-label="Catatan"
          placeholder="Catatan (wajib bila ditolak)"
          maxLength={noteMaxLength}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        {agrees.map((agree, place) => (
          <button
            key={agree.decision}
            type="button"
            className={`${place === 0 ? shared.button : shared.quiet} ${own.decideControl}`}
            disabled={pending}
            onClick={() => send(agree.decision)}
          >
            {agree.label}
          </button>
        ))}
        <button
          type="button"
          className={`${shared.quiet} ${own.decideControl}`}
          disabled={pending}
          onClick={reject}
        >
          Tolak
        </button>
      </div>
      <FormMessage state={{ error: refusal, done: null }} />
    </>
  );
}
