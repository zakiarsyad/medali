import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { BulkBar, CardTick } from "./bulk-bar";
import { tickableIds, tickedOf, ticksAfter } from "./bulk-validation";
import { CardDecision } from "./card-decision";
import { type CardAnswers, shownCards } from "./card-decisions";
import styles from "./verification.module.css";
import type { DecisionAnswer, VerificationCard } from "./verification-card";
import { VerificationCardView } from "./verification-card-view";

/** The ticks on the cards, and the press that validates the ticked ones. */
export interface BulkParts {
  /** The keys of the cards ticked so far. */
  ticked: readonly string[];
  busy: boolean;
  /** What the last press answered, or null before any. */
  state: FormState | null;
  onTicks: (ticked: string[]) => void;
  /** Validates these cards: the ticked ones that still wait. */
  onValidate: (cardIds: string[]) => void;
}

/**
 * The photo cards as they are drawn for the answers so far: each card
 * the list holds, and each that was decided here and has left the list
 * since. A card that waits can be ticked and offers "Validasi" and
 * "Tolak"; the last answer to a decision stays under its card. "Pilih
 * semua" ticks the waiting cards shown. With no card at all the panel
 * says so.
 */
export function PhotoCardsView({
  cards,
  answers,
  emptyWords,
  bulk,
  onAnswer,
}: {
  cards: VerificationCard[];
  answers: CardAnswers;
  /** What is said when there is no card to show. */
  emptyWords: string;
  bulk: BulkParts;
  onAnswer: (cardId: string, answer: DecisionAnswer) => void;
}) {
  const shown = shownCards(cards, answers);
  if (shown.length === 0) return <p className={shared.empty}>{emptyWords}</p>;
  const tickable = tickableIds(shown);
  const ticked = tickedOf(bulk.ticked, shown);
  const hasBar = tickable.length > 0 || bulk.state !== null;
  return (
    <>
      {hasBar && (
        <BulkBar
          tickable={tickable.length}
          ticked={ticked.length}
          busy={bulk.busy}
          state={bulk.state}
          onTickAll={(isTicked) => bulk.onTicks(isTicked ? tickable : [])}
          onValidate={() => bulk.onValidate(ticked)}
        />
      )}
      <div className={styles.photoCards}>
        {shown.map((card) => {
          const answer = answers[card.id];
          return (
            <VerificationCardView key={card.id} card={card}>
              {card.status === "waiting" && (
                <>
                  <CardTick
                    name={card.name}
                    isTicked={ticked.includes(card.id)}
                    busy={bulk.busy}
                    onTick={(isTicked) =>
                      bulk.onTicks(ticksAfter(ticked, card.id, isTicked))
                    }
                  />
                  <CardDecision
                    cardId={card.id}
                    name={card.name}
                    onAnswer={(sent) => onAnswer(card.id, sent)}
                  />
                </>
              )}
              {answer !== undefined && <FormMessage state={answer.state} />}
            </VerificationCardView>
          );
        })}
      </div>
    </>
  );
}
