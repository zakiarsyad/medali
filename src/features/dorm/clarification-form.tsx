"use client";

import { unstable_rethrow } from "next/navigation";
import { type FormEvent, useRef, useTransition } from "react";
import {
  draftOf,
  type SendEdges,
  sendDraft,
} from "@/clarifications/clarification-draft";
import type { FormState } from "@/ui/form-message";
import { shrinkPhoto } from "@/ui/shrink-photo";
import { sendDormClarificationAction } from "./clarification-actions";
import { ClarificationFormView } from "./clarification-form-view";

/** The form's ties to this browser and to the server. */
const EDGES: SendEdges = {
  shrink: shrinkPhoto,
  send: sendDormClarificationAction,
  rethrow: unstable_rethrow,
};

/**
 * The form a resident clarifies an absence with, for the activity on the
 * day of one row of Riwayat. What it checks and sends is decided apart
 * from it and what it draws is in its view; this only ties the two to
 * the browser. It is sent by the screen code, not by the browser, which
 * would empty the fields on any answer. What the server answers goes to
 * `onAnswer`.
 */
export function ClarificationForm({
  activityId,
  day,
  onAnswer,
  onCancel,
}: {
  activityId: string;
  day: string;
  onAnswer: (answer: FormState) => void;
  onCancel: () => void;
}) {
  const [sending, startSending] = useTransition();
  // Set at the press itself: `sending` is known only once the form is
  // drawn again, and a second press can come before that.
  const isOnItsWay = useRef(false);

  function submitted(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isOnItsWay.current) return;
    isOnItsWay.current = true;
    const form = new FormData(event.currentTarget);
    const draft = draftOf({ activityId, day }, form);
    startSending(async () => {
      try {
        onAnswer(await sendDraft(draft, EDGES));
      } finally {
        isOnItsWay.current = false;
      }
    });
  }

  return (
    <ClarificationFormView
      sending={sending}
      onSubmit={submitted}
      onCancel={onCancel}
    />
  );
}
