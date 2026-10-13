"use client";

import { type FormEvent, useActionState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { cancelReplacementAction } from "./replacement-actions";

const START: FormState = { error: null, done: null };

/**
 * "Batalkan" on a row of "Riwayat penggantian", for an account that may
 * cancel. It asks first. The button shows only while the replacement
 * waits; what the cancel answered stays under the status after the row
 * became Dibatalkan, so this stands in every row, also in one that waits
 * no more.
 */
export function CancelReplacementButton({
  replacementId,
  isWaiting,
  question,
}: {
  replacementId: string;
  isWaiting: boolean;
  /** What is asked before the cancel is sent. */
  question: string;
}) {
  const [state, action, pending] = useActionState(
    cancelReplacementAction,
    START,
  );

  function confirmFirst(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm(question)) event.preventDefault();
  }

  return (
    <form action={action} onSubmit={confirmFirst} className={shared.inline}>
      <input type="hidden" name="replacementId" value={replacementId} />
      {isWaiting && (
        <button type="submit" className={shared.danger} disabled={pending}>
          Batalkan
        </button>
      )}
      <FormMessage state={state} />
    </form>
  );
}
