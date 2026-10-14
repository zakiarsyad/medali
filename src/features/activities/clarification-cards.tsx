"use client";

import { useState } from "react";
import { ClarificationFileDialog } from "@/clarifications/clarification-file-dialog";
import { answersAfter } from "./card-decisions";
import { type ClarificationCard, fileAddressOf } from "./clarification-card";
import {
  ClarificationCardsView,
  NO_CLARIFICATION_ANSWERS,
} from "./clarification-cards-view";

/**
 * The clarification cards of one page of the list. It holds what the
 * server answered to each decision made here and which card has its file
 * open; which cards follow from that is decided apart from it, and so is
 * how they are drawn. It is made anew for each address, so another
 * filter or page starts without answers.
 */
export function ClarificationCards({
  cards,
  emptyWords,
}: {
  cards: ClarificationCard[];
  emptyWords: string;
}) {
  const [answers, setAnswers] = useState(NO_CLARIFICATION_ANSWERS);
  const [opened, setOpened] = useState<ClarificationCard | null>(null);
  return (
    <>
      <ClarificationCardsView
        cards={cards}
        answers={answers}
        emptyWords={emptyWords}
        onOpenFile={setOpened}
        onAnswer={(cardId, answer) =>
          setAnswers((before) => answersAfter(before, { cardId, answer }))
        }
      />
      {opened?.file && (
        <ClarificationFileDialog
          key={opened.id}
          file={opened.file}
          addressOf={(isShown) => fileAddressOf(opened.id, isShown)}
          onClose={() => setOpened(null)}
        />
      )}
    </>
  );
}
