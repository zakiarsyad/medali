import { type FormEvent, startTransition } from "react";

/**
 * Sends a form from the screen code, not by the browser. The browser puts
 * a sent form back on its first values, also when the answer is an error,
 * and what the person picked must stay to be corrected. Used as the
 * form's `onSubmit`, with the action that `useActionState` gives.
 */
export function sendForm(
  event: FormEvent<HTMLFormElement>,
  save: (form: FormData) => void,
): void {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  startTransition(() => save(form));
}
