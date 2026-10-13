"use client";

import { unstable_rethrow } from "next/navigation";
import { useState, useTransition } from "react";
import { CardDecisionView } from "./card-decision-view";
import { answerTo } from "./card-decisions";
import {
  rejectAttendanceAction,
  validateAttendanceAction,
} from "./verification-actions";
import type { DecisionAnswer } from "./verification-card";

/**
 * "Validasi" and "Tolak" of one waiting card. It holds the reason being
 * chosen and whether a decision is on its way; what the server answers
 * goes to `onAnswer`.
 */
export function CardDecision({
  cardId,
  name,
  onAnswer,
}: {
  cardId: string;
  name: string;
  onAnswer: (answer: DecisionAnswer) => void;
}) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [busy, startDeciding] = useTransition();

  function decide(send: () => Promise<DecisionAnswer>) {
    startDeciding(async () => {
      onAnswer(await answerTo(send, unstable_rethrow));
    });
  }

  return (
    <CardDecisionView
      name={name}
      reason={reason}
      note={note}
      busy={busy}
      onReason={setReason}
      onNote={setNote}
      onValidate={() => decide(() => validateAttendanceAction(cardId))}
      onReject={() =>
        decide(() => rejectAttendanceAction(cardId, reason, note))
      }
    />
  );
}
