"use client";

import { useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { cancelLeaveAction } from "./leave-actions";

const NOTHING_SAID: FormState = { error: null, done: null };

/** "Batalkan" on a request that waits. It asks first. */
export function CancelLeaveButton({
  id,
  question,
}: {
  id: string;
  /** The question asked before the request is cancelled. */
  question: string;
}) {
  const [said, setSaid] = useState(NOTHING_SAID);
  const [pending, startSending] = useTransition();

  function press() {
    if (!window.confirm(question)) return;
    startSending(async () => setSaid(await cancelLeaveAction(id)));
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
      <FormMessage state={said} />
    </>
  );
}
