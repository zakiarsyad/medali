"use client";

import { useState } from "react";
import type { ClarificationCard } from "./clarification-card";
import { ClarificationCardsView } from "./clarification-cards-view";
import { ClarificationFileDialog } from "./clarification-file-dialog";

/**
 * The clarification cards of one page of the list. It holds which card
 * has its file open; how the cards are drawn is decided apart from it.
 */
export function ClarificationCards({
  cards,
  emptyWords,
}: {
  cards: ClarificationCard[];
  emptyWords: string;
}) {
  const [opened, setOpened] = useState<ClarificationCard | null>(null);
  return (
    <>
      <ClarificationCardsView
        cards={cards}
        emptyWords={emptyWords}
        onOpenFile={setOpened}
      />
      {opened?.file && (
        <ClarificationFileDialog
          key={opened.id}
          clarificationId={opened.id}
          file={opened.file}
          onClose={() => setOpened(null)}
        />
      )}
    </>
  );
}
