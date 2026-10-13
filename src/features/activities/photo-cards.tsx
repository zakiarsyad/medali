"use client";

import { unstable_rethrow } from "next/navigation";
import { useState, useTransition } from "react";
import type { FormState } from "@/ui/form-message";
import { type BulkAnswer, bulkQuestion } from "./bulk-validation";
import {
  answerOr,
  answersAfter,
  answersAfterMany,
  DECISION_NOT_SENT,
  NO_ANSWERS,
} from "./card-decisions";
import { PhotoCardsView } from "./photo-cards-view";
import { validateTickedAction } from "./verification-actions";
import type { VerificationCard } from "./verification-card";

const NOT_SENT: BulkAnswer = {
  state: { error: DECISION_NOT_SENT, done: null },
  cards: [],
};

/**
 * The photo cards of one page of the list. It holds what the server
 * answered to each decision made here, which cards are ticked, and what
 * the last "Validasi (n) terpilih" answered; which cards follow from
 * that is decided apart from it, and so is how they are drawn. It is
 * made anew for each address, so another filter or page starts without
 * answers and without ticks.
 */
export function PhotoCards({
  cards,
  emptyWords,
}: {
  cards: VerificationCard[];
  emptyWords: string;
}) {
  const [answers, setAnswers] = useState(NO_ANSWERS);
  const [ticked, setTicked] = useState<readonly string[]>([]);
  const [said, setSaid] = useState<FormState | null>(null);
  const [busy, startValidating] = useTransition();

  /** Asks first; a card decided since its tick is not among `cardIds`. */
  function validate(cardIds: string[]) {
    if (!window.confirm(bulkQuestion(cardIds.length))) return;
    startValidating(async () => {
      const answer = await answerOr(
        () => validateTickedAction(cardIds),
        unstable_rethrow,
        NOT_SENT,
      );
      setAnswers((before) => answersAfterMany(before, answer.cards));
      setSaid(answer.state);
    });
  }

  return (
    <PhotoCardsView
      cards={cards}
      answers={answers}
      emptyWords={emptyWords}
      bulk={{
        ticked,
        busy,
        state: said,
        onTicks: setTicked,
        onValidate: validate,
      }}
      onAnswer={(cardId, answer) =>
        setAnswers((before) => answersAfter(before, { cardId, answer }))
      }
    />
  );
}
