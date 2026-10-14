"use client";

import { useState } from "react";
import { ClarificationFileDialog } from "@/clarifications/clarification-file-dialog";
import shared from "@/ui/data-screen.module.css";
import { clarificationFileAddress } from "./clarification-address";
import type { DormClarificationCard } from "./clarification-card";
import { ClarificationCardView } from "./clarification-card-view";
import styles from "./leave.module.css";

/**
 * The clarification cards of one page of the list, as they were read
 * when the page opened, and the box that shows the file of the card
 * whose file name was pressed. It is made anew for each address.
 */
export function ClarificationCards({
  cards,
  emptyWords,
}: {
  cards: DormClarificationCard[];
  /** What is said when there is no card to show. */
  emptyWords: string;
}) {
  const [opened, setOpened] = useState<DormClarificationCard | null>(null);

  if (cards.length === 0) return <p className={shared.empty}>{emptyWords}</p>;
  return (
    <>
      <ul className={styles.cards}>
        {cards.map((card) => (
          <ClarificationCardView
            key={card.id}
            card={card}
            onOpenFile={() => setOpened(card)}
          />
        ))}
      </ul>
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
