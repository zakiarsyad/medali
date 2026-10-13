"use client";

import { useReducer } from "react";
import { answersAfter, NO_ANSWERS } from "./card-decisions";
import { PhotoCardsView } from "./photo-cards-view";
import type { VerificationCard } from "./verification-card";

/**
 * The photo cards of one page of the list. It holds what the server
 * answered to each decision made here; which cards follow from that is
 * decided apart from it, and so is how they are drawn. It is made anew
 * for each address, so another filter or page starts without answers.
 */
export function PhotoCards({
  cards,
  emptyWords,
}: {
  cards: VerificationCard[];
  emptyWords: string;
}) {
  const [answers, tell] = useReducer(answersAfter, NO_ANSWERS);
  return (
    <PhotoCardsView
      cards={cards}
      answers={answers}
      emptyWords={emptyWords}
      onAnswer={(cardId, answer) => tell({ cardId, answer })}
    />
  );
}
