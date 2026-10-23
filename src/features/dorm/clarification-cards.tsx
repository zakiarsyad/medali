"use client";

import { useState } from "react";
import { ClarificationFileDialog } from "@/clarifications/clarification-file-dialog";
import { clarificationFileAddress } from "./clarification-address";
import type { DormClarificationCard } from "./clarification-card";
import {
  type CardAnswers,
  type CardRights,
  ClarificationCardsView,
} from "./clarification-cards-view";

/**
 * The clarification cards of one page of the list, as they were read
 * when the page opened. It holds what the server answered to each press
 * made here and which card has its file open; how the cards are drawn is
 * apart from it. It is made anew for each address, so another filter or
 * page starts without answers.
 */
export function ClarificationCards({
  cards,
  rights,
  ownStudentId,
  emptyWords,
}: {
  cards: DormClarificationCard[];
  rights: CardRights;
  /** The student the account belongs to, or null. */
  ownStudentId: string | null;
  /** What is said when there is no card to show. */
  emptyWords: string;
}) {
  const [answers, setAnswers] = useState<CardAnswers>({});
  const [opened, setOpened] = useState<DormClarificationCard | null>(null);
  return (
    <>
      <ClarificationCardsView
        cards={cards}
        rights={rights}
        ownStudentId={ownStudentId}
        answers={answers}
        emptyWords={emptyWords}
        onOpenFile={setOpened}
        onAnswer={(cardId, answer) =>
          setAnswers((before) => ({ ...before, [cardId]: answer }))
        }
      />
      {opened?.file && (
        <ClarificationFileDialog
          key={opened.id}
          file={opened.file}
          addressOf={(isShown) => clarificationFileAddress(opened.id, isShown)}
          onClose={() => setOpened(null)}
        />
      )}
    </>
  );
}
