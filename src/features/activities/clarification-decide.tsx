"use client";

import { unstable_rethrow } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { decideClarificationAction } from "./clarification-actions";
import { ClarificationDecideView } from "./clarification-decide-view";
import {
  answerToPress,
  type ClarificationAnswer,
  type DecisionKind,
} from "./clarification-decision";

/**
 * The Catatan and the three decisions of one waiting clarification card.
 * It holds the note being typed and whether a decision is on its way;
 * what a press answers goes to `onAnswer`.
 */
export function ClarificationDecide({
  cardId,
  name,
  onAnswer,
}: {
  cardId: string;
  name: string;
  onAnswer: (answer: ClarificationAnswer) => void;
}) {
  const [note, setNote] = useState("");
  const [busy, startDeciding] = useTransition();
  // Set at the press itself: `busy` is known only once the card is drawn
  // again, and a second press can come before that.
  const isOnItsWay = useRef(false);

  function decide(pressed: DecisionKind) {
    if (isOnItsWay.current) return;
    isOnItsWay.current = true;
    startDeciding(async () => {
      try {
        const answer = await answerToPress(
          pressed,
          note,
          (kind, typed) => decideClarificationAction(cardId, kind, typed),
          unstable_rethrow,
        );
        onAnswer(answer);
      } finally {
        isOnItsWay.current = false;
      }
    });
  }

  return (
    <ClarificationDecideView
      name={name}
      note={note}
      busy={busy}
      onNote={setNote}
      onDecide={decide}
    />
  );
}
