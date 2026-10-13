import shared from "@/ui/data-screen.module.css";
import base from "./activities.module.css";
import type { ClarificationCard } from "./clarification-card";
import { ClarificationCardView } from "./clarification-card-view";

/**
 * The clarification cards as they are drawn: each card the list holds,
 * with its file opened by a press on its name. With no card at all the
 * panel says so.
 */
export function ClarificationCardsView({
  cards,
  emptyWords,
  onOpenFile,
}: {
  cards: ClarificationCard[];
  /** What is said when there is no card to show. */
  emptyWords: string;
  onOpenFile: (card: ClarificationCard) => void;
}) {
  if (cards.length === 0) return <p className={shared.empty}>{emptyWords}</p>;
  return (
    <div className={base.cards}>
      {cards.map((card) => (
        <ClarificationCardView
          key={card.id}
          card={card}
          onOpenFile={() => onOpenFile(card)}
        />
      ))}
    </div>
  );
}
