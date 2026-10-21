"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { callFromAssessmentAction } from "./assessment-call-actions";
import { CALL_BUTTON, callQuestion } from "./assessment-call-words";

const NO_MESSAGE: FormState = { error: null, done: null };

/**
 * "Panggil konseling", asked before it is sent. Once a call is kept the
 * page is read again, so the row shows its status instead. A refusal,
 * such as "Sudah ditugaskan.", stays beside the button.
 */
export function AssessmentCallButton({
  studentId,
  name,
}: {
  studentId: string;
  /** The student's name, for the question. */
  name: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<FormState>(NO_MESSAGE);
  const [pending, startSending] = useTransition();

  function press() {
    if (!window.confirm(callQuestion(name))) return;
    setMessage(NO_MESSAGE);
    startSending(async () => {
      const answer = await callFromAssessmentAction(studentId);
      setMessage(answer);
      if (answer.done !== null) router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        className={shared.quiet}
        disabled={pending}
        onClick={press}
      >
        {CALL_BUTTON}
      </button>
      <FormMessage state={message} />
    </>
  );
}
