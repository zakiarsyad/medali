"use client";

import type { FormEvent } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { useSaveState } from "@/ui/use-save-state";

const START: FormState = { error: null, done: null };

/**
 * A button that sends one change to a room, with the ids it is about. A
 * change that takes something away asks first.
 */
export function RoomButton({
  action,
  ids,
  confirm,
  children,
}: {
  action: (before: FormState, form: FormData) => Promise<FormState>;
  /** The hidden fields sent with the button, by name. */
  ids: Record<string, string>;
  /** The question asked before a change that takes something away. */
  confirm?: string;
  children: string;
}) {
  const [state, send, pending] = useSaveState(action, START);

  function confirmFirst(event: FormEvent<HTMLFormElement>) {
    if (confirm && !window.confirm(confirm)) event.preventDefault();
  }

  return (
    <form action={send} onSubmit={confirmFirst} className={shared.inline}>
      {Object.entries(ids).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button
        type="submit"
        className={confirm ? shared.danger : shared.link}
        disabled={pending}
      >
        {children}
      </button>
      <FormMessage state={state} />
    </form>
  );
}
