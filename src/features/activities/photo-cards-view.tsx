import shared from "@/ui/data-screen.module.css";
import { FormMessage } from "@/ui/form-message";
import { CardDecision } from "./card-decision";
import { type CardAnswers, shownCards } from "./card-decisions";
import styles from "./verification.module.css";
import type { DecisionAnswer, VerificationCard } from "./verification-card";
import { VerificationCardView } from "./verification-card-view";

/**
 * The photo cards as they are drawn for the answers so far: each card
 * the list holds, and each that was decided here and has left the list
 * since. A card that waits offers "Validasi" and "Tolak"; the last
 * answer to a decision stays under its card. With no card at all the
 * panel says so.
 */
export function PhotoCardsView({
  cards,
  answers,
  emptyWords,
  onAnswer,
}: {
  cards: VerificationCard[];
  answers: CardAnswers;
  /** What is said when there is no card to show. */
  emptyWords: string;
  onAnswer: (cardId: string, answer: DecisionAnswer) => void;
}) {
  const shown = shownCards(cards, answers);
  if (shown.length === 0) return <p className={shared.empty}>{emptyWords}</p>;
  return (
    <div className={styles.photoCards}>
      {shown.map((card) => {
        const answer = answers[card.id];
        return (
          <VerificationCardView key={card.id} card={card}>
            {card.status === "waiting" && (
              <CardDecision
                cardId={card.id}
                name={card.name}
                onAnswer={(sent) => onAnswer(card.id, sent)}
              />
            )}
            {answer !== undefined && <FormMessage state={answer.state} />}
          </VerificationCardView>
        );
      })}
    </div>
  );
}
