"use client";

import { useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import type { FormState } from "@/ui/form-message";
import styles from "./leave.module.css";
import { validateReturnAction, verifyReturnAction } from "./leave-actions";
import { DECISION_NOTE_MAX_LENGTH } from "./leave-ids";
import type { DecidedStatus } from "./return-messages";

/** Whose check of a report this is: BAM - BPHK's, or Pengelola Asrama's. */
export type ReturnCheck = "verify" | "validate";

const AGREE = {
  verify: { label: "Verifikasi", status: "verified" },
  validate: { label: "Validasi kembali", status: "validated" },
} as const;

const ACTIONS = {
  verify: verifyReturnAction,
  validate: validateReturnAction,
};

/**
 * Catatan, then "Verifikasi" or "Validasi kembali", and "Tolak", on a
 * report of a return. What the server answered goes to `onAnswer`, with
 * what the report is since when the decision was kept.
 */
export function ReturnDecide({
  reportId,
  check,
  onAnswer,
}: {
  reportId: string;
  check: ReturnCheck;
  onAnswer: (state: FormState, status: DecidedStatus | null) => void;
}) {
  const [note, setNote] = useState("");
  const [pending, startSending] = useTransition();
  const agree = AGREE[check];

  function send(decision: string, status: DecidedStatus) {
    startSending(async () => {
      const state = await ACTIONS[check](reportId, decision, note);
      onAnswer(state, state.done ? status : null);
    });
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
        onClick={() => send(check, agree.status)}
      >
        {agree.label}
      </button>
      <button
        type="button"
        className={shared.quiet}
        disabled={pending}
        onClick={() => send("reject", "rejected")}
      >
        Tolak
      </button>
    </div>
  );
}
