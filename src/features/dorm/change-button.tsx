import { useState, useTransition } from "react";
import { FormMessage, type FormState } from "@/ui/form-message";
import { refusedSave, sentOr } from "@/ui/save-not-sent";

/**
 * A button that sends one change and passes on what was done; a refusal
 * stays beside it. A change that takes something away asks first.
 */
export function ChangeButton({
  send,
  question,
  look,
  onDone,
  children,
}: {
  send: () => Promise<FormState>;
  /** The question asked before a change that takes something away. */
  question: string | null;
  look: string | undefined;
  onDone: (message: string) => void;
  children: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startSending] = useTransition();

  function press() {
    if (question !== null && !window.confirm(question)) return;
    startSending(async () => {
      const after = await sentOr(send, refusedSave);
      if (after.done) onDone(after.done);
      setError(after.error);
    });
  }

  return (
    <>
      <button type="button" className={look} onClick={press} disabled={pending}>
        {children}
      </button>
      <FormMessage state={{ error, done: null }} />
    </>
  );
}
