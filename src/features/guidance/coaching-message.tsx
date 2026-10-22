"use client";

import { createContext, type ReactNode, useState } from "react";
import { FormMessage, type FormState } from "@/ui/form-message";

const NO_MESSAGE: FormState = { error: null, done: null };

/**
 * Puts what a status change answered above the list. The row may leave
 * the list once the page is read again, as a student set to Selesai does
 * from "Belum selesai", so the message is not kept in the row.
 */
export const SetCoachingMessage = createContext<(message: FormState) => void>(
  () => undefined,
);

/** The last answer of a status change, above the list it was made in. */
export function CoachingMessageArea({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<FormState>(NO_MESSAGE);
  return (
    <SetCoachingMessage value={setMessage}>
      <FormMessage state={message} />
      {children}
    </SetCoachingMessage>
  );
}
