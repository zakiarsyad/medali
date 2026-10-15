"use client";

import { useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import type { FormState } from "@/ui/form-message";
import styles from "./leave.module.css";
import { DECISION_NOTE_MAX_LENGTH } from "./leave-ids";
import { REJECTION_NEEDS_NOTE } from "./leave-messages";

/**
 * Catatan, the agreeing button and "Tolak" on an item of Tugas saya.
 * "Tolak" without a note sends nothing and asks for the reason; with a
 * note it asks `question` first. What the server answered goes to
 * `onAnswer`.
 */
export function TaskDecide({
  agree,
  question,
  decide,
  onAnswer,
}: {
  /** The agreeing button, such as Setujui, and the decision it sends. */
  agree: { label: string; decision: string };
  /** What is asked before a rejection is sent. */
  question: string;
  decide: (decision: string, note: string) => Promise<FormState>;
  onAnswer: (answer: FormState) => void;
}) {
  const [note, setNote] = useState("");
  const [pending, startSending] = useTransition();

  function send(decision: string) {
    startSending(async () => {
      onAnswer(await decide(decision, note));
    });
  }

  function reject() {
    if (note.trim() === "") {
      onAnswer({ error: REJECTION_NEEDS_NOTE.error, done: null });
      return;
    }
    if (!window.confirm(question)) return;
    send("reject");
  }

  return (
    <div className={styles.decide}>
      <input
        className={shared.input}
        aria-label="Catatan"
        placeholder="Catatan (wajib bila ditolak)"
        maxLength={DECISION_NOTE_MAX_LENGTH}
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <button
        type="button"
        className={shared.button}
        disabled={pending}
        onClick={() => send(agree.decision)}
      >
        {agree.label}
      </button>
      <button
        type="button"
        className={shared.quiet}
        disabled={pending}
        onClick={reject}
      >
        Tolak
      </button>
    </div>
  );
}
