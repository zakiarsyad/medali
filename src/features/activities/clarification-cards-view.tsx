import shared from "@/ui/data-screen.module.css";
import { FormMessage } from "@/ui/form-message";
import base from "./activities.module.css";
import { shownCards } from "./card-decisions";
import type { ClarificationCard } from "./clarification-card";
import { ClarificationCardView } from "./clarification-card-view";
import { ClarificationDecide } from "./clarification-decide";
import type { ClarificationAnswer } from "./clarification-decision";

/** The last answer to a decision on each card, by the key of the card. */
export type ClarificationAnswers = Readonly<
  Record<string, ClarificationAnswer>
>;

export const NO_CLARIFICATION_ANSWERS: ClarificationAnswers = {};

/**
 * The clarification cards as they are drawn for the answers so far, the
 * newest first: each card the list holds, and each that was decided here
 * and has left the list since, in its place. A card that waits offers
 * its Catatan and the three decisions; the last answer to a decision
 * stays under its card. A press on a file name opens the file. With no
 * card at all the panel says so.
 */
export function ClarificationCardsView({
  cards,
  answers,
  emptyWords,
  onOpenFile,
  onAnswer,
}: {
  cards: ClarificationCard[];
  answers: ClarificationAnswers;
  /** What is said when there is no card to show. */
  emptyWords: string;
  onOpenFile: (card: ClarificationCard) => void;
  onAnswer: (cardId: string, answer: ClarificationAnswer) => void;
}) {
  const shown = shownCards(cards, answers, "newest-first");
  if (shown.length === 0) return <p className={shared.empty}>{emptyWords}</p>;
  return (
    <div className={base.cards}>
      {shown.map((card) => {
        const answer = answers[card.id];
        return (
          <ClarificationCardView
            key={card.id}
            card={card}
            onOpenFile={() => onOpenFile(card)}
          >
            {card.status === "submitted" && (
              <ClarificationDecide
                cardId={card.id}
                name={card.name}
                onAnswer={(sent) => onAnswer(card.id, sent)}
              />
            )}
            {answer !== undefined && <FormMessage state={answer.state} />}
          </ClarificationCardView>
        );
      })}
    </div>
  );
}
