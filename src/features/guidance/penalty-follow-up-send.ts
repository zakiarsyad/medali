"use client";

import { use, useState, useTransition } from "react";
import type { FormState } from "@/ui/form-message";
import { refusedSave, sentOr } from "@/ui/save-not-sent";
import type { FollowUpState, PenaltyFollowUp } from "./penalty-follow-up";
import { SetUnfinishedWork } from "./penalty-numbers";

function refusedFollowUp(message: string): FollowUpState {
  return { ...refusedSave(message), followUp: null, unfinishedWork: null };
}

const NO_MESSAGE: FormState = { error: null, done: null };

/**
 * Sends one follow-up of a penalty and shows what it answered: the
 * message beside what was pressed, the penalty as the server gave it
 * back in its row, and "Kerja sosial belum selesai" in the numbers.
 */
export function useFollowUpSend(onFollowUp: (next: PenaltyFollowUp) => void) {
  const [message, setMessage] = useState<FormState>(NO_MESSAGE);
  const [pending, startSending] = useTransition();
  const setUnfinishedWork = use(SetUnfinishedWork);

  function send(sending: () => Promise<FollowUpState>) {
    setMessage(NO_MESSAGE);
    startSending(async () => {
      const answer = await sentOr(sending, refusedFollowUp);
      setMessage({ error: answer.error, done: answer.done });
      if (answer.followUp !== null) onFollowUp(answer.followUp);
      if (answer.unfinishedWork !== null) {
        setUnfinishedWork(answer.unfinishedWork);
      }
    });
  }

  return { message, pending, send };
}
