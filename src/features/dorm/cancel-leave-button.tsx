"use client";

import { useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { refusedSave, sentOr } from "@/ui/save-not-sent";
import { cancelLeaveAction } from "./leave-actions";

/**
 * "Batalkan" on a request that waits. It asks first. A refusal stays
 * beside it; every answer is passed on, as the button leaves with its
 * row's new status once a cancel is kept.
 */
export function CancelLeaveButton({
  id,
  question,
  onCancelled,
}: {
  id: string;
  /** The question asked before the request is cancelled. */
  question: string;
  onCancelled: (answer: FormState) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startSending] = useTransition();

  function press() {
    if (!window.confirm(question)) return;
    startSending(async () => {
      const after = await sentOr(() => cancelLeaveAction(id), refusedSave);
      onCancelled(after);
      setError(after.error);
    });
  }

  return (
    <>
      <button
        type="button"
        className={shared.danger}
        onClick={press}
        disabled={pending}
      >
        Batalkan
      </button>
      <FormMessage state={{ error, done: null }} />
    </>
  );
}
